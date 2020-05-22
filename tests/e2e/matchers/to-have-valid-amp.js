/**
 * External dependencies
 */
import amphtmlValidator from 'amphtml-validator';
import fetch from 'node-fetch';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;
/**
 * WordPress dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';

/**
 * Helper to prepare the cookies to be passed to fetch
 *
 * @param {Array} cookies Array of cookies returned from page.getCookes().
 *
 * @return {string} The cookie string.
 */
async function parseCookies( cookies ) {
	let parsedCookies = '';
	cookies.forEach( ( cookie ) => {
		parsedCookies += `${ cookie.name }=${ cookie.value }; `;
	} );
	return parsedCookies;
}

/**
 * Test for valid AMP for logged in users.
 *
 * @param {string} path The HTML to be used for matching elements.
 *
 * @return {Object} Object containing the pass flag and message for the matcher
 */
async function validateAMPforLoggedInUser( path ) {
	let pass, message;
	const urlToFetch = 'object' === typeof path ? path.url() : createURL( path );
	const cookies = await page.cookies();

	// Make sure we have a login cookie
	expect( cookies.filter( ( cookie ) => cookie.name.match( /^wordpress_logged_in/ ) ).length ).toBeGreaterThan( 0 );

	// make the request
	const response = await fetch( urlToFetch, { headers: { cookie: parseCookies( cookies ) } } );
	if ( 200 === response.status ) {
		const html = await response.text();
		const { document: jsDoc } = ( new JSDOM( html ) ).window;
		try {
			expect( jsDoc.querySelector( '#amp-admin-bar-item-status-icon' ) ).toMatch( '✅' );
			pass = true;
			message = () => 'Expected logged-in user to have valid AMP';
		} catch ( error ) {
			pass = true;
			message = () => 'Expected logged-in user not to have valid AMP';
		}
	} else {
		pass = false;
		message = () => `fetch() error: ${ page.url() } returned a status of ${ response.status }`;
	}

	return { pass, message };
}

/**
 * Test for valid AMP for logged-out users.
 *
 * @param {string} path The URL path of the current site to check.
 *
 * @return {Object} Object containing the pass flag and message for the matcher
 */
async function validateAMPForLoggedOutUser( path ) {
	let pass, message;
	const urlToFetch = 'object' === typeof path ? path.url() : createURL( path );
	try {
		const response = await fetch( urlToFetch, { credentials: 'omit' } );
		if ( 200 !== response.status ) {
			pass = false;
			message = () => `fetch() error: ${ urlToFetch } returned a status of ${ response.statusText }`;
		} else {
			const html = await response.text();
			const validator = await amphtmlValidator.getInstance();
			const { status } = validator.validateString( html );
			pass = ( 'PASS' === status );
			message = () => `AMP Status: ${ status }`;
		}
	} catch ( error ) {
		pass = false;
		message = () => error.message;
	}
	return { pass, message };
}

/**
 * Jest matcher for asserting the URL at the given path validates with AMP.
 *
 * @param {( Object|string )} page The page object or a string that represents the URL to be fetched.
 * @param {Object} options Settings object to control the matcher.
 *
 * @return {Object} Object containing the pass flag and message for the matcher
 */
export async function toHaveValidAMP( page, { loggedIn = false } = {} ) {
	return loggedIn ? validateAMPforLoggedInUser( page ) : validateAMPForLoggedOutUser( page );
}
