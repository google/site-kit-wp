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
 */
export async function toHaveValidAMP( path ) {
	const result = {};
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

	return result;
}
