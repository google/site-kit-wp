const viewPorts = require( './viewports' );

const backstopOptions = ( scenarios ) => {
	const options = {
		onBeforeScript: 'puppet/onBefore.js',
		asyncCaptureLimit: 5,
		asyncCompareLimit: 50,
		debug: false,
		debugWindow: false,
		engine: 'puppeteer',
		engineOptions: {
			args: [ '--no-sandbox' ],
		},
		id: 'google-site-kit',
		paths: {
			bitmaps_reference: 'tests/backstop/reference',
			bitmaps_test: 'tests/backstop/tests',
			engine_scripts: 'tests/backstop/engine_scripts',
			html_report: 'tests/backstop/html_report',
			ci_report: 'tests/backstop/ci_report',
		},
		report: [ 'browser' ],
		scenarios,
		viewports: viewPorts,
		readyEvent: 'backstopjs_ready',
		misMatchThreshold: 0.05, // @todo change to 0, resolve SVG issue.
		delay: 1000, // Default delay to ensure components render in Travis.
	};
	return options;
};

module.exports = backstopOptions;
