const assets = require('../../../common/assets')
const routes = require('../routes')
const pages = require('../routes/pages')
const tests = require('../../test/frontend/routes')
const express = require('express')
const expressWs = require('@dannycoates/express-ws')
const morgan = require('morgan')
const config = require('../config')

const ID_REGEX = '([0-9a-fA-F]{10, 16})'

module.exports = function (app, devServer) {
	const wsapp = express()
	expressWs(wsapp, null, { perMessageDeflate: false })
	routes(wsapp)
	wsapp.ws('/api/ws', require('../routes/ws'))
	wsapp.listen(8081, config.listen_address)

	assets.setMiddleware(devServer.middleware)
	app.use(morgan('dev', { stream: process.stderr }))
	function android(req, res) {
		const index = devServer.middleware.fileSystem
			.readFileSync(devServer.middleware.getFilenameFromUrl('/android.html'))
			.toString()
			.replace(
				'<base href="file:///android_asset/" />',
				'<base href="http://localhost:8080/" />'
			)
		res.set('Content-Type', 'text/html')
		res.send(index)
	}
	if (process.env.ANDROID) {
		app.get('/', android)
		app.get(`/share/:id${ID_REGEX}`, android)
		app.get('/completed', android)
		app.get('/preferences', android)
		app.get('/options', android)
		app.get('/oauth', android)
	}
	routes(app)
	tests(app)
	process.nextTick(() => app.use(pages.notfound))
}
