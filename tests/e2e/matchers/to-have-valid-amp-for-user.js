/**
 * External dependencies
 */
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
 * Matcher to determine if the path has valid AMP for users
 *
 * @param {( string|Object )} path The string URI or page object
 *
 * @return {Object} Matcher results
 */
export async function toHaveValidAMPForUser( path ) {
	let pass, message;
	const urlToFetch = 'object' === typeof path ? path.url() : createURL( path );

	const cookies = await page.cookies();

	// Make sure we have a login cookie
	expect( cookies.some( ( { name } ) => name.match( /^wordpress_logged_in/ ) ) ).toBeTruthy();

	const html = await fetchPageContent( urlToFetch, );
	const { document: jsDoc } = ( new JSDOM( html ) ).window;
	try {
		expect( jsDoc.querySelector( '#amp-admin-bar-item-status-icon' ).textContent ).toMatch( '✅' );
		pass = true;
		message = () => 'Expected logged-in user not to have valid AMP';
	} catch ( error ) {
		pass = false;
		message = () => 'Expected logged-in user to have valid AMP';
	}
	return { pass, message };
}
