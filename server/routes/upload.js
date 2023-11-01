const crypto = require('crypto')
const storage = require('../storage')
const config = require('../config')
const mozlog = require('../log')
const Limiter = require('../limiter')
const { encryptedSize } = require('../../../app/utils')

const log = mozlog('send.upload')

module.exports = async function (req, res) {
	const newId = crypto.randomBytes(8).toString('hex')
	const metadata = req.header('X-File-Metadata')
	const auth = req.header('Authorization')
	if (!metadata || !auth) {
		return res.sendStatus(400)
	}
	const owner = crypto.randomBytes(10).toString('hex')
	const meta = {
		owner,
		metadata,
		auth: auth.split(' ')[1],
		nonce: crypto.randomBytes(16).toString('base64'),
	}

	try {
		const limiter = new Limiter(encryptedSize(config.max_file_size))
		const fileStream = req.pipe(limiter)
		await storage.set(newId, fileStream, meta, config.default_expire_seconds)
		const url = `${config.deriveBaseUrl(req)}/download/${newId}/`
		res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`)
		res.json({
			url,
			owner: meta.owner,
			id: newId,
		})
	} catch (e) {
		if (e.message === 'limit') {
			return res.sendStatus(413)
		}
		log.error('upload', e)
		res.sendStatus(500)
	}
}
