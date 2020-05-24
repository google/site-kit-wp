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
 * Internal dependencies
 */
import { fetchPageContent } from '../utils';

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

	// Get the logged in markup.
	const { success, payload } = await fetchPageContent( urlToFetch, cookies );

	if ( success ) {
		const { document: jsDoc } = ( new JSDOM( payload ) ).window;
		try {
			expect( jsDoc.querySelector( '#amp-admin-bar-item-status-icon' ).textContent ).toMatch( '✅' );
			pass = true;
			message = () => 'Expected logged-in user not to have valid AMP';
		} catch ( error ) {
			pass = false;
			message = () => 'Expected logged-in user to have valid AMP';
		}
	} else {
		pass = false;
		message = () => `fetchPageContent(${ urlToFetch }) returned an error:  ${ payload }`;
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

	const { success, payload } = await fetchPageContent( urlToFetch );
	if ( success ) {
		const validator = await amphtmlValidator.getInstance();
		const { status } = validator.validateString( payload );
		pass = ( 'PASS' === status );
		message = () => `AMP Status: ${ status }`;
	} else {
		pass = false;
		message = () => `fetchPageContent(${ urlToFetch }) returned an error:  ${ payload }`;
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
