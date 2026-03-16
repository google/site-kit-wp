/**
 * Playwright configuration for Site Kit E2E specs.
 *
 * Runs tests in parallel workers while sharing common defaults used across
 * the legacy Puppeteer suite (base URL, credentials, etc.).
 */

const { defineConfig } = require( '@playwright/test' );

const baseURL = process.env.WP_BASE_URL || 'http://localhost:9002';

module.exports = defineConfig( {
	testDir: './specs',
	testMatch: [ '**/*.playwright.spec.js' ],
	workers: 1, // Currently one worker limit is required as all tests share the same test site causing data conflicts.
	retries: process.env.CI ? 1 : 0,
	timeout: 60_000,
	expect: {
		timeout: 5_000,
	},
	use: {
		baseURL,
		headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
		retries: process.env.CI ? 3 : 2,
		screenshot: 'only-on-failure',
		trace: 'on-first-retry',
		video: 'on-first-retry',
	},
	reporter: [
		[ 'list' ],
		[
			'html',
			{
				open: 'never',
				outputFolder: 'artifacts/playwright-html',
			},
		],
	],
	outputDir: 'artifacts/playwright-output',
} );
