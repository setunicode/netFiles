const routes = require('../../../app/routes')
const storage = require('../storage')
const state = require('../state')

function stripEvents(str) {
	return str.replace(/\son\w+=""/g, '')
}

module.exports = {
	index: async function (req, res) {
		const appState = await state(req)
		res.send(stripEvents(routes().toString('/blank', appState)))
	},

	blank: async function (req, res) {
		const appState = await state(req)
		res.send(stripEvents(routes().toString('/blank', appState)))
	},

	download: async function (req, res, next) {
		const id = req.params.id
		const appState = await state(req)
		try {
			const { nonce, pwd } = await storage.metadata(id)
			res.set('WWW-Authenticate', `send-v1 ${nonce}`)
			res.send(
				stripEvents(
					routes().toString(
						`/download/${id}`,
						Object.assign(appState, {
							downloadMetadata: { nonce, pwd },
						})
					)
				)
			)
		} catch (e) {
			next()
		}
	},

	unsupported: async function (req, res) {
		const appState = await state(req)
		res.send(
			stripEvents(
				routes().toString(`/unsupported/${req.params.reason}`, appState)
			)
		)
	},

	notfound: async function (req, res) {
		const appState = await state(req)
		res
			.status(404)
			.send(
				stripEvents(
					routes().toString(
						'/404',
						Object.assign(appState, { downloadMetadata: { status: 404 } })
					)
				)
			)
	},
}
