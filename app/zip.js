import crc32 from 'crc/crc32'

const encoder = new TextEncoder()

function dosDateTime(dateTime = new Date()) {
	const year = (dateTime.getFullYear() - 1980) << 9
	const month = (dateTime.getMonth() + 1) << 5
	const day = dateTime.getDate()
	const date = year | month | day
	const hour = dateTime.getHours() << 11
	const minute = dateTime.getMinutes() << 5
	const second = Math.floor(dateTime.getSeconds() / 2)
	const time = hour | minute | second

	return { date, time }
}

class File {
	constructor(info) {
		this.name = encoder.encode(info.name)
		this.size = info.size
		this.bytesRead = 0
		this.crc = null
		this.dateTime = dosDateTime()
	}

	get header() {
		const h = new ArrayBuffer(30 + this.name.byteLength)
		const v = new DataView(h)
		v.setUint32(0, 0x04034b50, true)
		v.setUint16(4, 20, true)
		v.setUint16(6, 0x808, true)
		v.setUint16(8, 0, true)
		v.setUint16(10, this.dateTime.time, true)
		v.setUint16(12, this.dateTime.date, true)
		v.setUint32(14, 0, true)
		v.setUint32(18, 0, true)
		v.setUint32(22, 0, true)
		v.setUint16(26, this.name.byteLength, true)
		v.setUint16(28, 0, true)
		for (let i = 0; i < this.name.byteLength; i++) {
			v.setUint8(30 + i, this.name[i])
		}
		return new Uint8Array(h)
	}

	get dataDescriptor() {
		const dd = new ArrayBuffer(16)
		const v = new DataView(dd)
		v.setUint32(0, 0x08074b50, true)
		v.setUint32(4, this.crc, true)
		v.setUint32(8, this.size, true)
		v.setUint32(12, this.size, true)
		return new Uint8Array(dd)
	}

	directoryRecord(offset) {
		const dr = new ArrayBuffer(46 + this.name.byteLength)
		const v = new DataView(dr)
		v.setUint32(0, 0x02014b50, true)
		v.setUint16(4, 20, true)
		v.setUint16(6, 20, true)
		v.setUint16(8, 0x808, true)
		v.setUint16(10, 0, true)
		v.setUint16(12, this.dateTime.time, true)
		v.setUint16(14, this.dateTime.date, true)
		v.setUint32(16, this.crc, true)
		v.setUint32(20, this.size, true)
		v.setUint32(24, this.size, true)
		v.setUint16(28, this.name.byteLength, true)
		v.setUint16(30, 0, true)
		v.setUint16(32, 0, true)
		v.setUint16(34, 0, true)
		v.setUint16(36, 0, true)
		v.setUint32(38, 0, true)
		v.setUint32(42, offset, true)
		for (let i = 0; i < this.name.byteLength; i++) {
			v.setUint8(46 + i, this.name[i])
		}
		return new Uint8Array(dr)
	}

	get byteLength() {
		return this.size + this.name.byteLength + 30 + 16
	}

	append(data, controller) {
		this.bytesRead += data.byteLength
		const endIndex = data.byteLength - Math.max(this.bytesRead - this.size, 0)
		const buf = data.slice(0, endIndex)
		this.crc = crc32(buf, this.crc)
		controller.enqueue(buf)
		if (endIndex < data.byteLength) {
			return data.slice(endIndex, data.byteLength)
		}
	}
}

function centralDirectory(files, controller) {
	let directoryOffset = 0
	let directorySize = 0
	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		const record = file.directoryRecord(directoryOffset)
		directoryOffset += file.byteLength
		controller.enqueue(record)
		directorySize += record.byteLength
	}
	controller.enqueue(eod(files.length, directorySize, directoryOffset))
}

function eod(fileCount, directorySize, directoryOffset) {
	const e = new ArrayBuffer(22)
	const v = new DataView(e)
	v.setUint32(0, 0x06054b50, true)
	v.setUint16(4, 0, true)
	v.setUint16(6, 0, true)
	v.setUint16(8, fileCount, true)
	v.setUint16(10, fileCount, true)
	v.setUint32(12, directorySize, true)
	v.setUint32(16, directoryOffset, true)
	v.setUint16(20, 0, true)
	return new Uint8Array(e)
}

class ZipStreamController {
	constructor(files, source) {
		this.files = files
		this.fileIndex = 0
		this.file = null
		this.reader = source.getReader()
		this.nextFile()
		this.extra = null
	}

	nextFile() {
		this.file = this.files[this.fileIndex++]
	}

	async pull(controller) {
		if (!this.file) {
			centralDirectory(this.files, controller)
			return controller.close()
		}
		if (this.file.bytesRead === 0) {
			controller.enqueue(this.file.header)
			if (this.extra) {
				this.extra = this.file.append(this.extra, controller)
			}
		}
		if (this.file.bytesRead >= this.file.size) {
			controller.enqueue(this.file.dataDescriptor)
			this.nextFile()
			return this.pull(controller)
		}
		const data = await this.reader.read()
		if (data.done) {
			this.nextFile()
			return this.pull(controller)
		}
		this.extra = this.file.append(data.value, controller)
	}
}

export default class Zip {
	constructor(manifest, source) {
		this.files = manifest.files.map(info => new File(info))
		this.source = source
	}

	get stream() {
		return new ReadableStream(new ZipStreamController(this.files, this.source))
	}

	get size() {
		const entries = this.files.reduce(
			(total, file) => total + file.byteLength * 2 - file.size,
			0
		)
		const eod = 22
		return entries + eod
	}
}
