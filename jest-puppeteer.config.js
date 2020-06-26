const config = require( '@wordpress/scripts/config/puppeteer.config.js' );

// https://github.com/smooth-code/jest-puppeteer/blob/master/packages/jest-environment-puppeteer/README.md#jest-puppeteerconfigjs
module.exports = {
	launch: {
		...( config.launch || {} ),
		args: [
			// https://peter.sh/experiments/chromium-command-line-switches/
			'--disable-gpu',
			'--no-sandbox',
			'--lang=en-US',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
		],
	},
	// connect: {
	// 	// https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteerconnectoptions
	// 	...( config.connect || {} ),
	// },
};
