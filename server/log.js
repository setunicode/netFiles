const conf = require('./config')

const isProduction = conf.env === 'production'

const mozlog = require('mozlog')({
	app: 'netFiles',
	level: isProduction ? 'INFO' : 'verbose',
	fmt: isProduction ? 'heka' : 'pretty',
	debug: !isProduction,
})

module.exports = mozlog
