/**
 * External dependencies
 */
import amphtmlValidator from 'amphtml-validator';
import fetch from 'node-fetch';

/**
 * WordPress dependencies
 */
import {
	createURL,
} from '@wordpress/e2e-test-utils';

/**
 * Jest matcher for asserting the URL at the given path validates with AMP.
 *
 * @param {string} path The URL path of the current site to check.
 * @param {Object } options Settings object to control the matcher.
 */
export async function toHaveValidAMP( path, options = { loggedIn: false } ) {
	const { loggedIn } = options;
	const result = {};
	if ( true === loggedIn ) {
		await Promise.all( [
			page.goto( createURL( path ), { waitUntil: 'load' } ),
			page.waitForSelector( '#amp-admin-bar-item-status-icon' ),
		] );
		try {
			await expect( page ).toMatchElement( '#amp-admin-bar-item-status-icon', { text: '✅' } );
			result.pass = true;
			result.message = () => 'Expected logged-in user to have valid AMP';
		} catch ( e ) {
			result.pass = true;
			result.message = () => 'Expected logged-in user not to have valid AMP';
		}
	} else {
		try {
			const url = createURL( path );
			const response = await fetch( url, { credentials: 'omit' } );
			if ( 200 !== response.status ) {
				result.pass = false;
				result.message = () => `fetch() error: ${ url } returned a status of ${ response.statusText }`;
			} else {
				const html = await response.text();
				await amphtmlValidator.getInstance().then( ( validator ) => {
					const { status } = validator.validateString( html );
					result.pass = ( 'PASS' === status );
					result.message = () => `AMP Status: ${ status }`;
				} );
			}
		} catch ( error ) {
			result.pass = false;
			result.message = () => error.message;
		}
	}

	return result;
}
