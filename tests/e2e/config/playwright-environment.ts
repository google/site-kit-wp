/**
 * Jest environment that runs each spec file in Playwright Chromium.
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
import { type Browser, type BrowserContext, chromium } from '@playwright/test';
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node';

/**
 * Internal dependencies
 */
import {
	type CompatPage,
	createCompatPage,
} from './puppeteer-shim-compatibility';

/**
 * The `browser` global: opens more pages in the same browser context.
 *
 * @since n.e.x.t
 */
export interface E2EBrowser {
	newPage(): Promise< CompatPage >;
	version(): string;
}

/**
 * Launches Chromium for each spec file and exposes `browser` and `page`
 * globals to the specs. `page` keeps the Puppeteer-style API the specs were
 * written against.
 *
 * Environment variables:
 *
 * - `E2E_HEADLESS=false` shows the browser window.
 * - `E2E_SLOWMO=<ms>` slows down every browser action.
 * - `E2E_DEVTOOLS=true` opens DevTools in each tab.
 * - `E2E_TRACE=<path>` records a Playwright trace to the given zip file.
 *
 * @since n.e.x.t
 */
export default class PlaywrightEnvironment extends NodeEnvironment {
	private browser?: Browser;

	private browserContext?: BrowserContext;

	async setup() {
		await super.setup();

		const args = [
			// Fixes SSL issues that can happen when running the tests locally.
			'--disable-web-security',
		];
		if ( process.env.E2E_DEVTOOLS === 'true' ) {
			args.push( '--auto-open-devtools-for-tabs' );
		}

		const browser = await chromium.launch( {
			headless: process.env.E2E_HEADLESS !== 'false',
			slowMo: parseInt( process.env.E2E_SLOWMO || '', 10 ) || 0,
			args,
		} );

		const context = await browser.newContext( {
			// Puppeteer's default viewport. The bootstrap sets the size tests use.
			viewport: { width: 800, height: 600 },
			// WordPress 7.0+ enables cross-document View Transitions in
			// wp-admin unless the user prefers reduced motion. In headless
			// Chromium they can stall rendering after a navigation, which
			// blocks Playwright's actionability checks.
			reducedMotion: 'reduce',
		} );

		if ( process.env.E2E_TRACE ) {
			await context.tracing.start( {
				screenshots: true,
				snapshots: true,
			} );
		}

		this.browser = browser;
		this.browserContext = context;

		const e2eBrowser: E2EBrowser = {
			newPage: async () =>
				createCompatPage( await context.newPage(), context ),
			version: () => browser.version(),
		};

		Object.assign( this.global, {
			browser: e2eBrowser,
			page: createCompatPage( await context.newPage(), context ),
		} );
	}

	async teardown() {
		if ( process.env.E2E_TRACE ) {
			await this.browserContext?.tracing.stop( {
				path: process.env.E2E_TRACE,
			} );
		}
		await this.browser?.close();
		await super.teardown();
	}
}
