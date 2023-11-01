import assert from 'assert'
import Archive from '../../../../app/archive'
import FileSender from '../../../../app/fileSender'

const blob = new Blob(['hello world!'], { type: 'text/plain' })
blob.name = 'text.txt'
const archive = new Archive([blob])

describe('FileSender', function () {
	describe('upload', function () {
		it('returns an OwnedFile on success', async function () {
			const fs = new FileSender()
			const file = await fs.upload(archive)
			assert.ok(file.id)
			assert.equal(file.name, archive.name)
		})
	})
})
