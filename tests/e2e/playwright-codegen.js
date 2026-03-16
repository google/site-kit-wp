#!/usr/bin/env node

/**
 * Playwright Codegen Script
 *
 * This script sets up a Site Kit environment and opens the Playwright Inspector
 * for interactive test recording.
 *
 * Usage:
 *   npm run test:e2e:playwright:codegen
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

const { chromium } = require( '@playwright/test' );
const {
	WP_BASE_URL,
	loginAsAdmin,
	setupSiteKit,
} = require( './playwright/utils' );

( async () => {
	// eslint-disable-next-line no-console
	console.log( 'Launching browser...' );

	const browser = await chromium.launch( { headless: false } );
	const context = await browser.newContext( {
		baseURL: WP_BASE_URL,
		ignoreHTTPSErrors: true,
	} );
	const page = await context.newPage();

	// eslint-disable-next-line no-console
	console.log( 'Setting up Site Kit...' );

	await loginAsAdmin( page );
	await setupSiteKit( page );

	// eslint-disable-next-line no-console
	console.log(
		'Setup complete. Opening Playwright Inspector for recording...'
	);
	// eslint-disable-next-line no-console
	console.log( 'Use the Record button to generate test code.' );
	// eslint-disable-next-line no-console
	console.log( 'Exit with Ctrl+C once you are done.' );

	await page.pause();
} )();
