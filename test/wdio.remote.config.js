const common = require('./wdio.common.conf')
const path = require('path')

exports.config = Object.assign({}, common.config, {
	baseUrl: process.env.TEST_SERVER || 'https://send.dev.mozaws.net',
	exclude: [
		path.join(__dirname, './integration/unit-tests.js'),
		path.join(__dirname, './integration/download-tests.js'),
	],
	capabilities: [
		{ browserName: 'firefox' },
		{ browserName: 'chrome' },
		{ browserName: 'MicrosoftEdge' },
		{
			browserName: 'safari',
		},
	],
	services: ['sauce'],
	user: process.env.SAUCE_USERNAME,
	key: process.env.SAUCE_ACCESS_KEY,
})
