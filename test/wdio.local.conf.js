const ip = require('ip')
const common = require('./wdio.common.conf')

exports.config = Object.assign({}, common.config, {
	baseUrl: `http://${ip.address()}:8000`,
	maxInstances: 1,
	bail: 1,
	services: [require('./testServer')],
})
