const cp = require('child_process')
const { promisify } = require('util')
const pkg = require('../package.json')
const conf = require('../server/config')

const exec = promisify(cp.exec)
const cmd = `compare-locales l10n.toml . ${getLocales()} --data=json`

console.log(cmd)

exec(cmd)
	.then(({ stdout }) => JSON.parse(stdout))
	.then(({ details }) => filterErrors(details))
	.then(results => {
		if (results.length) {
			results.forEach(({ locale, data }) => {
				console.log(locale)
				data.forEach(msg => console.log(`- ${msg}`))
				console.log('')
			})
			process.exit(2)
		}
	})
	.catch(err => {
		console.error(err)
		process.exit(1)
	})

function filterErrors(details) {
	return Object.keys(details)
		.sort()
		.map(locale => {
			const data = details[locale]
				.filter(item => Object.prototype.hasOwnProperty.call(item, 'error'))
				.map(({ error }) => error)
			return { locale, data }
		})
		.filter(({ data }) => data.length)
}

function getLocales() {
	if (conf.env === 'production' || process.argv.includes('--production')) {
		return pkg.availableLanguages.sort().join(' ')
	}

	return '`ls public/locales`'
}
