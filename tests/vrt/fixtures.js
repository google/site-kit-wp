/**
 * Visual regression test fixtures.
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
const { test: base, expect } = require( '@playwright/test' );
const { pick } = require( 'lodash' );

/**
 * Internal dependencies
 */
const { ALLOWED_HOSTS, FIXED_NOW } = require( './constants' );
const { getScenarios } = require( './scenarios' );

// The project `use` options a browser context takes.
const CONTEXT_OPTIONS = [
	'baseURL',
	'colorScheme',
	'deviceScaleFactor',
	'locale',
	'timezoneId',
	'viewport',
];

/**
 * Prepares every document before its own scripts run.
 *
 * Runs in the browser, in every frame of the context.
 *
 * @since n.e.x.t
 *
 * @param {Object} options     Options.
 * @param {number} options.now The timestamp "now" should start at.
 */
function initDocument( { now } ) {
	// Start every capture with empty storage, like a fresh browser. Feature
	// flags still arrive through the URL's `features` parameter.
	try {
		window.localStorage.clear();
		window.sessionStorage.clear();
	} catch ( error ) {
		// Storage is unavailable in some cross-origin frames.
	}

	// Pin the date without faking timers: Playwright's clock would also fake
	// `requestAnimationFrame` and timers, and drifts on a long-lived context.
	const RealDate = window.Date;
	const offset = now - RealDate.now();

	function VRTDate( ...args ) {
		if ( ! new.target ) {
			return new RealDate( RealDate.now() + offset ).toString();
		}

		return args.length
			? new RealDate( ...args )
			: new RealDate( RealDate.now() + offset );
	}

	VRTDate.prototype = RealDate.prototype;
	VRTDate.now = () => RealDate.now() + offset;
	VRTDate.parse = RealDate.parse;
	VRTDate.UTC = RealDate.UTC;

	window.Date = VRTDate;
}

/**
 * Creates a browser context set up for visual regression tests.
 *
 * @since n.e.x.t
 *
 * @param {Object} browser The Playwright browser.
 * @param {Object} project The Playwright project, for its `use` options.
 * @return {Promise<Object>} The browser context.
 */
async function createContext( browser, project ) {
	// A worker-scoped context doesn't get the project's `use` options
	// automatically, unlike Playwright's own `context` fixture.
	const context = await browser.newContext(
		pick( project.use, CONTEXT_OPTIONS )
	);

	await context.addInitScript( initDocument, { now: FIXED_NOW } );

	return context;
}

/**
 * Tracks a page's network activity and navigations during one test.
 *
 * @since n.e.x.t
 *
 * @param {Object} page     The Playwright page.
 * @param {Object} testInfo The Playwright test info.
 * @return {Object} The tracker.
 */
function trackPage( page, testInfo ) {
	const pending = new Set();
	const failures = [];
	const blocked = new Set();
	let lastActivity = Date.now();
	let documentLoads = 0;

	function isAllowed( url ) {
		const { protocol, hostname } = new URL( url );

		return (
			! [ 'http:', 'https:' ].includes( protocol ) ||
			ALLOWED_HOSTS.includes( hostname )
		);
	}

	function onRequest( request ) {
		pending.add( request );
		lastActivity = Date.now();

		if (
			request.isNavigationRequest() &&
			request.frame() === page.mainFrame()
		) {
			documentLoads++;
		}
	}

	function onRequestDone( request ) {
		pending.delete( request );
		lastActivity = Date.now();
	}

	function onRequestFailed( request ) {
		onRequestDone( request );

		const errorText = request.failure()?.errorText || '';

		// Loads cancelled by a navigation, e.g. the previous story's.
		if ( errorText.includes( 'ERR_ABORTED' ) ) {
			return;
		}

		if ( isAllowed( request.url() ) ) {
			failures.push( `${ request.url() } (${ errorText })` );
		} else {
			blocked.add( request.url() );
		}
	}

	page.on( 'request', onRequest );
	page.on( 'requestfinished', onRequestDone );
	page.on( 'requestfailed', onRequestFailed );

	return {
		/**
		 * Waits until no request has been pending for `quietMs`.
		 *
		 * @since n.e.x.t
		 *
		 * @param {number} quietMs   How long the network must be quiet.
		 * @param {number} timeoutMs How long to wait at most.
		 */
		async waitForQuiet( quietMs, timeoutMs ) {
			const start = Date.now();

			while ( pending.size > 0 || Date.now() - lastActivity < quietMs ) {
				if ( Date.now() - start > timeoutMs ) {
					testInfo.annotations.push( {
						type: 'pending requests',
						description: [ ...pending ]
							.map( ( request ) => request.url() )
							.join( '\n' ),
					} );
					return;
				}

				await new Promise( ( resolve ) => setTimeout( resolve, 25 ) );
			}
		},

		/**
		 * Fails the test if the story reloaded or an allowed request failed.
		 *
		 * @since n.e.x.t
		 */
		assertHealthy() {
			if ( documentLoads > 1 ) {
				throw new Error(
					'The story reloaded the page. Its feature flags probably differ from the ' +
						'`features` the scenario was given: set them as literal ' +
						'`parameters.features` on the story or its default export.'
				);
			}

			if ( failures.length ) {
				throw new Error(
					`Requests failed:\n${ failures.join( '\n' ) }`
				);
			}
		},

		/**
		 * Stops tracking, and notes requests to hosts that aren't allowed.
		 *
		 * @since n.e.x.t
		 */
		dispose() {
			page.off( 'request', onRequest );
			page.off( 'requestfinished', onRequestDone );
			page.off( 'requestfailed', onRequestFailed );

			if ( blocked.size ) {
				testInfo.annotations.push( {
					type: 'blocked requests',
					description: [ ...blocked ].join( '\n' ),
				} );
			}
		},
	};
}

const test = base.extend( {
	// One context and page per worker, so the browser's HTTP and code caches
	// stay warm: every capture is still a fresh navigation, but far cheaper
	// than a fresh browser. Each worker runs a single project (viewport).
	vrtContext: [
		async ( { browser }, use, workerInfo ) => {
			const context = await createContext( browser, workerInfo.project );

			await use( context );
			await context.close();
		},
		{ scope: 'worker' },
	],

	vrtPage: [
		async ( { vrtContext }, use ) => {
			const page = await vrtContext.newPage();

			// Warm the caches, and load the web fonts once, before the first
			// capture.
			const [ scenario ] = getScenarios();

			await page.goto( scenario.url );
			await page
				.waitForFunction(
					() =>
						document.documentElement.dataset.vrtStoryState !==
						'pending'
				)
				.catch( () => {} );

			await use( page );
		},
		{ scope: 'worker' },
	],

	openStory: async ( { browser, vrtContext, vrtPage }, use, testInfo ) => {
		const contexts = [];
		const trackers = [];
		let openedPage;

		await vrtContext.clearCookies();

		await use( async ( scenario ) => {
			let page = vrtPage;

			// Hovering or clicking moves the mouse, which would leak into the
			// next story on a shared page.
			if ( scenario.hasInteractions ) {
				const context = await createContext(
					browser,
					testInfo.project
				);

				contexts.push( context );
				page = await context.newPage();
			}

			const network = trackPage( page, testInfo );

			trackers.push( network );
			openedPage = page;
			await page.goto( scenario.url );

			return { page, network };
		} );

		// When a test fails before comparing its screenshot (the story errored,
		// or the test timed out), show what rendered in the report. Done here
		// because a timed-out test's own code never resumes.
		const failed = testInfo.status !== testInfo.expectedStatus;
		const hasScreenshot = testInfo.attachments.some( ( { name } ) =>
			name.endsWith( '-actual.png' )
		);

		if ( openedPage && failed && ! hasScreenshot ) {
			const body = await openedPage
				.screenshot( { fullPage: true, timeout: 5000 } )
				.catch( () => null );

			if ( body ) {
				await testInfo.attach( 'failure.png', {
					body,
					contentType: 'image/png',
				} );
			}
		}

		trackers.forEach( ( tracker ) => tracker.dispose() );
		await Promise.all( contexts.map( ( context ) => context.close() ) );
	},
} );

module.exports = { expect, test };
