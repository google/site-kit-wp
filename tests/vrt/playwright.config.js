/**
 * Playwright config for the visual regression tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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

/**
 * External dependencies
 */
const { defineConfig } = require( '@playwright/test' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { ALLOWED_HOSTS, PORT } = require( './constants' );
const viewports = require( './viewports' );

const CI = !! process.env.CI;

// Each worker runs one browser; locally, use half the CPU cores.
let workers = CI ? 4 : '50%';

if ( process.env.VRT_WORKERS ) {
	workers = Number( process.env.VRT_WORKERS );
}

// Resolve every host except the allowed ones to nothing. Unlike
// `page.route()`, this keeps the browser's HTTP cache enabled.
const HOST_RESOLVER_RULES = [
	'MAP * ~NOTFOUND',
	...ALLOWED_HOSTS.map( ( host ) => `EXCLUDE ${ host }` ),
].join( ', ' );

/**
 * Builds the pattern for tests limited to viewports other than this one.
 *
 * @since n.e.x.t
 *
 * @param {string} label The viewport label.
 * @return {RegExp} Matches the `@only-<viewport>` tags of the other viewports.
 */
function otherViewportsTag( label ) {
	const others = viewports
		.map( ( viewport ) => viewport.label )
		.filter( ( other ) => other !== label );

	return new RegExp( `@only-(${ others.join( '|' ) })\\b` );
}

module.exports = defineConfig( {
	testDir: __dirname,
	testMatch: 'vrt.spec.js',
	outputDir: path.join( __dirname, 'test-results' ),
	// For example, `__screenshots__/components/button/default/small.png`.
	snapshotPathTemplate: '{testDir}/__screenshots__/{arg}/{projectName}{ext}',
	fullyParallel: true,
	forbidOnly: CI,
	workers,
	// A test that passes on retry is reported as flaky instead of failing.
	retries: CI ? 1 : 0,
	// A change that affects many stories should be approved, not retried.
	maxFailures: CI ? 100 : 0,
	timeout: 60000,
	reporter: CI
		? [
				[
					'blob',
					{ outputDir: path.join( __dirname, 'blob-report' ) },
				],
				[ 'github' ],
				[ 'dot' ],
		  ]
		: [
				[ 'list' ],
				[
					'html',
					{
						open: 'never',
						outputFolder: path.join(
							__dirname,
							'playwright-report'
						),
					},
				],
		  ],
	expect: {
		// Headroom for a slow screenshot, e.g. when Docker emulates amd64.
		timeout: 20000,
		toHaveScreenshot: {
			// `storybook/preview-head-vrt.html` disables animations, except
			// in `.googlesitekit-vrt-animation-paused`, which keeps them paused.
			animations: 'allow',
			caret: 'hide',
			scale: 'css',
			threshold: 0.2,
			maxDiffPixels: 0,
		},
	},
	use: {
		// Chromium's "new" headless mode, i.e. the full browser, not the
		// headless shell: the shell rounds glyph positions to whole pixels, which
		// spaces text unevenly.
		channel: 'chromium',
		baseURL: `http://localhost:${ PORT }`,
		colorScheme: 'light',
		deviceScaleFactor: 1,
		locale: 'en-US',
		timezoneId: 'UTC', // eslint-disable-line sitekit/acronym-case
		trace: process.env.VRT_TRACE ? 'retain-on-failure' : 'off',
		launchOptions: {
			args: [ `--host-resolver-rules=${ HOST_RESOLVER_RULES }` ],
		},
	},
	projects: viewports.map( ( { label, width, height } ) => ( {
		name: label,
		use: { viewport: { width, height } },
		grepInvert: otherViewportsTag( label ),
	} ) ),
	webServer: {
		command: `node ${ JSON.stringify(
			path.join( __dirname, 'server.js' )
		) }`,
		url: `http://localhost:${ PORT }/iframe.html`,
		reuseExistingServer: ! CI,
		stdout: 'ignore',
		stderr: 'pipe',
	},
} );
