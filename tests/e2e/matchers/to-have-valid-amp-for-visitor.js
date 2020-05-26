/**
 * External dependencies
 */
import amphtmlValidator from 'amphtml-validator';
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
 * Matcher to determine if the path has valid AMP for vistors ( not logged in)
 *
 * @param {( string|Object )} path The string URI or page object
 *
 * @return {Object} Matcher results
 */
export async function toHaveValidAMPForVisitor( path ) {
	const urlToFetch = 'object' === typeof path ? path.url() : createURL( path );

	const html = await fetchPageContent( urlToFetch, { credentials: 'omit' } );
	// make sure that we don't see the AMP bar
	const { document: jsDoc } = ( new JSDOM( html ) ).window;
	expect( jsDoc.querySelector( '#amp-admin-bar-item-status-icon' ) ).toBeNull();

	const validator = await amphtmlValidator.getInstance();
	const { status } = validator.validateString( html );
	const pass = ( 'PASS' === status );
	const message = () => `AMP Status: ${ status }`;

	return { pass, message };
}
