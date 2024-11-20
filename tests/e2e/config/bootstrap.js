/**
 * E2E tests: config bootstrapping.
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

/**
 * External dependencies
 */
import { setDefaultOptions } from 'expect-puppeteer';
import { get } from 'lodash';
import { ConsoleMessage } from 'puppeteer';

/**
 * WordPress dependencies
 */
import {
	clearLocalStorage,
	enablePageDialogAccept,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	clearSessionStorage,
	deactivateUtilityPlugins,
	resetSiteKit,
} from '../utils';
import * as customMatchers from '../matchers';

/**
 * Environment variables.
 */
const { PUPPETEER_TIMEOUT, EXPECT_PUPPETEER_TIMEOUT } = process.env;

/**
 * Set of console logging types observed to protect against unexpected yet
 * handled (i.e. not catastrophic) errors or warnings. Each key corresponds
 * to the Puppeteer ConsoleMessage type, its value the corresponding function
 * on the console global object.
 *
 * @since 1.0.0
 *
 * @type {Object<string,string>}
 */
const OBSERVED_CONSOLE_MESSAGE_TYPES = {
	warning: 'warn',
	error: 'error',
	log: 'log',
	info: 'log',
};

/**
 * Array of page event tuples of [ eventName, handler ].
 *
 * @since 1.0.0
 *
 * @type {Array}
 */
const pageEvents = [];

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );
// Set default timeout for Puppeteer waits. (Default: 30 sec)
page.setDefaultTimeout( 5000 );
// Set default timeout for individual expect-puppeteer assertions. (Default: 1000)
setDefaultOptions( { timeout: EXPECT_PUPPETEER_TIMEOUT || 1000 } );

// Add custom matchers specific to Site Kit.
expect.extend( customMatchers );

/**
 * Adds an event listener to the page to handle additions of page event
 * handlers, to assure that they are removed at test teardown.
 *
 * @since 1.0.0
 */
function capturePageEventsForTearDown() {
	page.on( 'newListener', ( eventName, listener ) => {
		pageEvents.push( [ eventName, listener ] );
	} );
}

/**
 * Opts out of all Analytics tracking on page load.
 *
 * This function emulates the behavior of the opt-out browser extension,
 * which is the only way to opt-out in an AMP-friendly way
 * since AMP does not allow for arbitrary JS from the origin.
 *
 * @since 1.13.0
 * @see {@link https://tools.google.com/dlpage/gaoptout}
 */
function optOutOfEventTracking() {
	page.on( 'load', async () => {
		try {
			await page.evaluate( () => {
				window._gaUserPrefs = { ioo: () => true };
			} );
		} catch ( err ) {}
	} );
}

/**
 * Removes all bound page event handlers.
 *
 * @since 1.0.0
 */
function removePageEvents() {
	while ( pageEvents.length ) {
		const [ eventName, handler ] = pageEvents.pop();
		page.off( eventName, handler );
	}
}

/**
 * Adds a page event handler to emit uncaught exception to process if one of
 * the observed console logging types is encountered.
 *
 * @since 1.0.0
 */
function observeConsoleLogging() {
	page.on( 'console', ( message ) => {
		const type = message.type();
		if ( ! OBSERVED_CONSOLE_MESSAGE_TYPES.hasOwnProperty( type ) ) {
			return;
		}

		let text = message.text();

		// An exception is made for _blanket_ deprecation warnings: Those
		// which log regardless of whether a deprecated feature is in use.
		if ( text.includes( 'This is a global warning' ) ) {
			return;
		}

		// Viewing posts on the front end can result in this error, which
		// has nothing to do with Gutenberg.
		if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
			return;
		}

		// We log this separately now in a way which includes the URL
		// which is much more useful than this message.
		if (
			text.startsWith(
				'Failed to load resource: the server responded with a status of'
			)
		) {
			return;
		}

		// A bug present in WordPress 5.2 will produce console warnings when
		// loading the Dashicons font. These can be safely ignored, as they do
		// not otherwise regress on application behavior. This logic should be
		// removed once the associated ticket has been closed.
		//
		// See: https://core.trac.wordpress.org/ticket/47183
		if (
			text.startsWith( 'Failed to decode downloaded font:' ) ||
			text.startsWith( 'OTS parsing error:' ) ||
			text.includes(
				'Download the React DevTools for a better development experience'
			) ||
			text.includes(
				"Can't perform a React state update on an unmounted component"
			) ||
			text.includes(
				'https://fb.me/react-unsafe-component-lifecycles'
			) ||
			text.includes( 'https://fb.me/react-strict-mode-' )
		) {
			return;
		}

		// Some error messages which don't impact test results can
		// be safely ignored.
		if (
			text.startsWith( 'Powered by AMP' ) ||
			text.startsWith( 'data_error unknown response key' ) ||
			text.includes(
				'No triggers were found in the config. No analytics data will be sent.'
			)
		) {
			return;
		}

		// Ignore errors thrown by `@wordpress/api-fetch`. These are actual,
		// legimate request failures, but they can happen during a navigation
		// (or when actually offline).
		//
		// We ignore them as they are not indicative of a problem with the
		// test and usually make E2E tests fail erroneously.
		if ( text.includes( 'You are probably offline.' ) ) {
			return;
		}

		// WordPress 5.3 logs when a block is saved and causes console logs
		// that should not cause failures.
		if ( text.startsWith( 'Block successfully updated for' ) ) {
			return;
		}

		// As of WordPress 5.3.2 in Chrome 79, navigating to the block editor
		// (Posts > Add New) will display a console warning about
		// non - unique IDs.
		// See: https://core.trac.wordpress.org/ticket/23165
		if ( text.includes( 'elements with non-unique id #_wpnonce' ) ) {
			return;
		}

		// WordPress 6.3 moved the editor into an iframe and warns when
		// when styles are added incorrectly.
		// See https://github.com/WordPress/gutenberg/blob/5977e3d60b7aea6e22d4a452f7525d3f140c37b6/packages/block-editor/src/components/iframe/index.js#L170
		// Here we ignore core those from core themes in case we add our own styles
		// here in the future.
		if (
			text.match( /^twenty[a-z-]+ was added to the iframe incorrectly/ )
		) {
			return;
		}

		// WordPress 6.6 logs when loading the block editor which causes console error.
		if ( text.startsWith( 'Warning: You are importing createRoot from' ) ) {
			return;
		}

		let logFunction = OBSERVED_CONSOLE_MESSAGE_TYPES[ type ];

		// At this point, any unexpected message will result in a test failure.

		// Check if it's raised by the AMP plugin.
		if ( isPluginConsoleMessage( 'amp', message ) ) {
			// Convert console messages originating from AMP to debug statements.
			// This avoids failing tests from console errors we don't have control of.
			logFunction = 'debug';
		}

		// As of Puppeteer 1.6.1, `message.text()` wrongly returns an object of
		// type JSHandle for error logging, instead of the expected string.
		//
		// See: https://github.com/GoogleChrome/puppeteer/issues/3397
		//
		// The recommendation there to asynchronously resolve the error value
		// upon a console event may be prone to a race condition with the test
		// completion, leaving a possibility of an error not being surfaced
		// correctly. Instead, the logic here synchronously inspects the
		// internal object shape of the JSHandle to find the error text. If it
		// cannot be found, the default text value is used instead.
		text = get(
			message.args(),
			[ 0, '_remoteObject', 'description' ],
			text
		);

		// Disable reason: We intentionally bubble up the console message
		// which, unless the test explicitly anticipates the logging via
		// @wordpress/jest-console matchers, will cause the intended test
		// failure.

		// eslint-disable-next-line no-console
		console[ logFunction ]( text );
	} );
}

/**
 * Checks if the given console message is coming from a specific plugin.
 *
 * @since 1.98.0
 *
 * @param {string}         pluginSlug Plugin slug.
 * @param {ConsoleMessage} message    Console message.
 * @return {boolean} Whether or not a match was found.
 */
function isPluginConsoleMessage( pluginSlug, message ) {
	return message
		.stackTrace()
		.some( ( { url } ) =>
			url.match(
				`${ process.env.WP_BASE_URL }/wp-content/plugins/${ pluginSlug }/`
			)
		);
}

/**
 * Observes the given navigation request.
 *
 * @since 1.0.0
 *
 * @param {Object} req HTTP request object.
 */
function observeNavigationRequest( req ) {
	if ( req.isNavigationRequest() ) {
		const data = [ req.method(), req.url() ];
		if ( 'POST' === req.method() ) {
			data.push( req.postData() );
		}
		// eslint-disable-next-line no-console
		console.debug( 'NAV', ...data );
	}
}

/**
 * Observes the given navigation response.
 *
 * @since 1.0.0
 *
 * @param {Object} res HTTP response object.
 */
function observeNavigationResponse( res ) {
	if ( res.request().isNavigationRequest() ) {
		const data = [ res.status(), res.request().method(), res.url() ];
		const redirect = res.headers().location;
		if ( redirect ) {
			data.push( { redirect } );
		}
		// eslint-disable-next-line no-console
		console.debug( ...data );
	}
}

/**
 * Observes the given REST request.
 *
 * @since 1.0.0
 *
 * @param {Object} req HTTP request object from the REST API request.
 */
function observeRestRequest( req ) {
	if ( req.url().match( 'wp-json' ) ) {
		const data = [ req.method(), req.url() ];
		if ( 'POST' === req.method() ) {
			data.push( req.postData() );
		}
		// eslint-disable-next-line no-console
		console.debug( '>>>', ...data );
	}
}

/**
 * Observes the given REST response.
 *
 * @since 1.0.0
 *
 * @param {Object} res HTTP response object from the REST API request.
 */
async function observeRestResponse( res ) {
	if ( res.url().match( 'wp-json' ) ) {
		const data = [ res.status(), res.request().method(), res.url() ];

		// The response may fail to resolve if the test ends before it completes.
		try {
			data.push( await res.text() );
			console.debug( ...data ); // eslint-disable-line no-console
		} catch ( err ) {} // eslint-disable-line no-empty
	}
}

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	capturePageEventsForTearDown();
	optOutOfEventTracking();
	enablePageDialogAccept();
	observeConsoleLogging();
	// Log uncaught exceptions on the client.
	// eslint-disable-next-line no-console
	page.on( 'pageerror', console.error );

	if ( '1' === process.env.DEBUG_NAV ) {
		page.on( 'request', observeNavigationRequest );
		page.on( 'response', observeNavigationResponse );
	}
	if ( '1' === process.env.DEBUG_REST ) {
		page.on( 'request', observeRestRequest );
		page.on( 'response', observeRestResponse );
	}

	// There's no good way to otherwise conditionally enable this logging
	// since the code needs to be built into the e2e-utilities.js.
	if ( '1' === process.env.DEBUG_REDUX ) {
		OBSERVED_CONSOLE_MESSAGE_TYPES.debug = 'debug';
	}

	await setBrowserViewport( 'large' );

	await deactivateUtilityPlugins();
	await resetSiteKit( { persistent: true } );
} );

afterEach( async () => {
	await clearLocalStorage();
	await clearSessionStorage();
	await setBrowserViewport( 'large' );
} );

afterAll( async () => {
	await deactivateUtilityPlugins();
	await resetSiteKit();
	removePageEvents();
	await page.setRequestInterception( false );
} );
