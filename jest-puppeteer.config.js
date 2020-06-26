// https://github.com/smooth-code/jest-puppeteer/blob/master/packages/jest-environment-puppeteer/README.md#jest-puppeteerconfigjs

exports.launch = {
	// https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteerlaunchoptions
	headless: process.env.HEADLESS !== 'no',
	args: [
		// https://peter.sh/experiments/chromium-command-line-switches/
		'--disable-gpu',
		'--no-sandbox',
		'--lang=en-US',
		'--disable-setuid-sandbox',
		'--disable-dev-shm-usage',
	],
};

// exports.connect = {
// 	// https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#puppeteerconnectoptions
// };
