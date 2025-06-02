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
 * Array of console messages to ignore.
 */
const IGNORE_CONSOLE_MESSAGES = [
	// An exception is made for _blanket_ deprecation warnings
	{
		matcher: 'includes',
		pattern: 'This is a global warning',
	},
	// Viewing posts on the front end can result in this error
	{
		matcher: 'includes',
		pattern: 'net::ERR_UNKNOWN_URL_SCHEME',
	},
	// Failed to load resource messages are logged separately
	{
		matcher: 'startsWith',
		pattern:
			'Failed to load resource: the server responded with a status of',
	},
	// WordPress font loading warnings
	{
		matcher: 'startsWith',
		pattern: 'Failed to decode downloaded font:',
	},
	{
		matcher: 'startsWith',
		pattern: 'OTS parsing error:',
	},
	// React development messages
	{
		matcher: 'includes',
		pattern:
			'Download the React DevTools for a better development experience',
	},
	{
		matcher: 'includes',
		pattern: "Can't perform a React state update on an unmounted component",
	},
	{
		matcher: 'includes',
		pattern: 'https://fb.me/react-unsafe-component-lifecycles',
	},
	{
		matcher: 'includes',
		pattern: 'https://fb.me/react-strict-mode-',
	},
	// AMP and analytics messages
	{
		matcher: 'startsWith',
		pattern: 'Powered by AMP',
	},
	{
		matcher: 'startsWith',
		pattern: 'data_error unknown response key',
	},
	{
		matcher: 'includes',
		pattern:
			'No triggers were found in the config. No analytics data will be sent.',
	},
	// Offline error messages
	{
		matcher: 'includes',
		pattern: 'You are probably offline.',
	},
	// WordPress block editor messages
	{
		matcher: 'startsWith',
		pattern: 'Block successfully updated for',
	},
	{
		matcher: 'includes',
		pattern: 'elements with non-unique id #_wpnonce',
	},
	// WordPress iframe style warnings
	{
		matcher: 'match',
		pattern: /^twenty[a-z-]+ was added to the iframe incorrectly/,
	},
	// WordPress React import warnings
	{
		matcher: 'startsWith',
		pattern: 'Warning: You are importing createRoot from',
	},
];

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
		page.removeListener( eventName, handler );
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

		// Check if the message should be ignored
		if (
			IGNORE_CONSOLE_MESSAGES.some( ( { matcher, pattern } ) => {
				switch ( matcher ) {
					case 'includes':
						return text.includes( pattern );
					case 'startsWith':
						return text.startsWith( pattern );
					case 'match':
						return text.match( pattern );
					default:
						return false;
				}
			} )
		) {
			return;
		}

		let logFunction = OBSERVED_CONSOLE_MESSAGE_TYPES[ type ];

		// Check if it's raised by the AMP plugin
		if ( isPluginConsoleMessage( 'amp', message ) ) {
			logFunction = 'debug';
		}

		text = get(
			message.args(),
			[ 0, '_remoteObject', 'description' ],
			text
		);

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

		try {
			data.push( await res.text() );
			console.debug( ...data ); // eslint-disable-line no-console
		} catch ( err ) {} // eslint-disable-line no-empty
	}
}

// Before every test suite run, delete all content created by the test.
beforeAll( async () => {
	capturePageEventsForTearDown();
	optOutOfEventTracking();
	enablePageDialogAccept();
	observeConsoleLogging();
	page.on( 'pageerror', console.error ); // eslint-disable-line no-console

	if ( '1' === process.env.DEBUG_NAV ) {
		page.on( 'request', observeNavigationRequest );
		page.on( 'response', observeNavigationResponse );
	}
	if ( '1' === process.env.DEBUG_REST ) {
		page.on( 'request', observeRestRequest );
		page.on( 'response', observeRestResponse );
	}

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
