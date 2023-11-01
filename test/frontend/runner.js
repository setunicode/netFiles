const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const webpack = require('webpack')
const config = require('../../webpack.config')
const middleware = require('webpack-dev-middleware')
const express = require('express')
const devRoutes = require('../../server/bin/test')
const app = express()

const wpm = middleware(webpack(config(null, { mode: 'development' })), {
	logLevel: 'silent',
})
app.use(wpm)
devRoutes(app, { middleware: wpm })

function onConsole(msg) {}

const server = app.listen(async function () {
	let exitCode = -1
	const browser = await puppeteer.launch({
		args: ['--no-sandbox'],
	})
	try {
		const page = await browser.newPage()
		page.on('console', onConsole)
		page.on('pageerror', console.log.bind(console))
		await page.setDefaultNavigationTimeout(60000)
		await page.goto(`http://127.0.0.1:${server.address().port}/test`)
		await page.waitFor(() => typeof runner.testResults !== 'undefined', {
			polling: 1000,
			timeout: 15000,
		})
		const results = await page.evaluate(() => runner.testResults)
		const coverage = await page.evaluate(() => __coverage__)
		if (coverage) {
			const dir = path.resolve(__dirname, '../../.nyc_output')
			fs.mkdirSync(dir, {
				recursive: true,
			})
			fs.writeFileSync(
				path.resolve(dir, 'frontend.json'),
				JSON.stringify(coverage)
			)
		}
		const stats = results.stats
		exitCode = stats.failures
		console.log(`${stats.passes} passing (${stats.duration}ms)\n`)
		if (stats.failures) {
			console.log('Failures:\n')
			for (const f of results.failures) {
				console.log(`${f.fullTitle}`)
				console.log(` ${f.err.stack}\n`)
			}
		}
	} catch (e) {
		console.log(e)
	} finally {
		browser.close()
		server.close(() => {
			process.exit(exitCode)
		})
	}
})
