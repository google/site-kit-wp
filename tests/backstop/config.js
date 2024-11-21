/**
 * Backstop config.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const scenarios = require( './scenarios' );
const viewports = require( './viewports' );

module.exports = {
	onBeforeScript: 'puppet/onBefore.js',
	asyncCaptureLimit: 5,
	asyncCompareLimit: 50,
	debug: false,
	debugWindow: false,
	engine: 'puppeteer',
	engineOptions: {
		args: [
			'-disable-translate',
			'--disable-extensions',
			'--disable-background-networking',
			'--safebrowsing-disable-auto-update',
			'--disable-sync',
			'--metrics-recording-only',
			'--disable-default-apps',
			'--no-first-run',
			'--remote-debugging-port=9222',
			'--user-data-dir=/var/app/CHROME',
			'--disable-setuid-sandbox',
			'--window-size=1920,1080',
			'--disable-gpu',
			'--hide-scrollbars',
			'--user-agent=true',
			'--remote-debugging-address=0.0.0.0',
			'--no-sandbox',
			'--no-zygote',
			'--headless',
			'--autoplay-policy=no-user-gesture-required',
			'--disable-notifications',
			'--disable-logging',
			'--disable-permissions-api',
		],
		executablePath: '/usr/bin/chromium',
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
	viewports,
	misMatchThreshold: 0,
	delay: 1000, // Default delay to ensure components render complete.
};
