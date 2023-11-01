const assets = require('../../common/assets')
const routes = require('../routes')
const pages = require('../routes/pages')
const tests = require('../../test/frontend/routes')
const expressWs = require('@dannycoates/express-ws')

module.exports = function (app, devServer) {
	assets.setMiddleware(devServer.middleware)
	expressWs(app, null, { perMessageDeflate: false })
	routes(app)
	app.ws('/api/ws', require('../routes/ws'))
	tests(app)
	process.nextTick(() => app.use(pages.notfound))
}
