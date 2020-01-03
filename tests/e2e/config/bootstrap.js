/**
 * External dependencies
 */
import { setDefaultOptions } from 'expect-puppeteer';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	clearLocalStorage,
	enablePageDialogAccept,
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	clearSessionStorage,
	deactivateUtilityPlugins,
	resetSiteKit,
} from '../utils';
import {
	toHaveAdSenseTag,
} from '../matchers';

/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

/**
 * Set of console logging types observed to protect against unexpected yet
 * handled (i.e. not catastrophic) errors or warnings. Each key corresponds
 * to the Puppeteer ConsoleMessage type, its value the corresponding function
 * on the console global object.
 *
 * @type {Object<string,string>}
 */
const OBSERVED_CONSOLE_MESSAGE_TYPES = {
	warning: 'warn',
	error: 'error',
};

/**
 * Array of page event tuples of [ eventName, handler ].
 *
 * @type {Array}
 */
const pageEvents = [];

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );
// Set default timeout for individual expect-puppeteer assertions. (Default: 500)
setDefaultOptions( { timeout: 2000 } );

// Add custom matchers specific to Site Kit.
expect.extend( {
	toHaveAdSenseTag,
} );

/**
 * Adds an event listener to the page to handle additions of page event
 * handlers, to assure that they are removed at test teardown.
 */
function capturePageEventsForTearDown() {
	page.on( 'newListener', ( eventName, listener ) => {
		pageEvents.push( [ eventName, listener ] );
	} );
}

/**
 * Opt out of all Analytics tracking on page load.
 * @link https://tools.google.com/dlpage/gaoptout
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

		// A bug present in WordPress 5.2 will produce console warnings when
		// loading the Dashicons font. These can be safely ignored, as they do
		// not otherwise regress on application behavior. This logic should be
		// removed once the associated ticket has been closed.
		//
		// See: https://core.trac.wordpress.org/ticket/47183
		if (
			text.startsWith( 'Failed to decode downloaded font:' ) ||
			text.startsWith( 'OTS parsing error:' )
		) {
			return;
		}

		const logFunction = OBSERVED_CONSOLE_MESSAGE_TYPES[ type ];

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
		text = get( message.args(), [ 0, '_remoteObject', 'description' ], text );

		// Disable reason: We intentionally bubble up the console message
		// which, unless the test explicitly anticipates the logging via
		// @wordpress/jest-console matchers, will cause the intended test
		// failure.

		// eslint-disable-next-line no-console
		console[ logFunction ]( text );
	} );
}

/**
 * Observe the given navigation request.
 *
 * @param {Object} req HTTP request object.
 */
function observeNavigationRequest( req ) {
	if ( req.isNavigationRequest() ) {
		// eslint-disable-next-line no-console
		console.log( 'NAV', req.method(), req.url(), req.postData() );
	}
}

/**
 * Observe the given REST request.
 *
 * @param {Object} req HTTP request object from the REST API request.
 */
function observeRestRequest( req ) {
	if ( req.url().match( 'wp-json' ) ) {
		// eslint-disable-next-line no-console
		console.log( '>>>', req.method(), req.url(), req.postData() );
	}
	if ( req.url().match( 'google-site-kit/v1/data/' ) ) {
		const rawBatchRequest = getQueryArg( req.url(), 'request' );
		try {
			const batchRequests = JSON.parse( rawBatchRequest );
			if ( Array.isArray( batchRequests ) ) {
				batchRequests.forEach( ( r ) => {
					// eslint-disable-next-line no-console
					console.log( '>>>', r.key, r.data );
				} );
			}
		} catch {}
	}
}

/**
 * Observe the given REST response.
 *
 * @param {Object} res HTTP response object from the REST API request.
 */
async function observeRestResponse( res ) {
	if ( res.url().match( 'wp-json' ) ) {
		const args = [ res.status(), res.request().method(), res.url() ];

		// The response may fail to resolve if the test ends before it completes.
		try {
			args.push( await res.text() );
			console.log( ...args ); // eslint-disable-line no-console
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
	}
	if ( '1' === process.env.DEBUG_REST ) {
		page.on( 'request', observeRestRequest );
		page.on( 'response', observeRestResponse );
	}
	await setBrowserViewport( 'large' );

	await deactivateUtilityPlugins();
	await resetSiteKit();
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
