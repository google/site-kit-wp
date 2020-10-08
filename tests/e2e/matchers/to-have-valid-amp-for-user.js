/**
 * `toHaveValidAMPForUser` matcher.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Determines if the path has valid AMP for users.
 *
 * @since 1.10.0
 *
 * @param {(string|Object)} path The string URI or page object.
 * @return {Object} Matcher results.
 */
export async function toHaveValidAMPForUser( path ) {
	let pass, message;
	const urlToFetch = 'object' === typeof path ? path.url() : createURL( path );

	const cookies = await page.cookies();

	// Make sure we have a login cookie
	if ( false === cookies.some( ( { name } ) => name.match( /^wordpress_logged_in/ ) ) ) {
		throw new Error( 'toHaveValidAMPForUser failed. User is not logged in.' );
	}

	const html = await fetchPageContent( urlToFetch );
	const jsDoc = new JSDOM( html ).window.document;
	try {
		const iconElement = jsDoc.querySelector( '#amp-admin-bar-item-status-icon' );
		// AMP v2 uses an amp-icon class, as well as additional classes for validity.
		if ( iconElement.classList.contains( 'amp-icon' ) ) {
			expect( iconElement.classList.contains( 'amp-valid' ) ).toBe( true );
		} else { // AMP v1
			expect( iconElement.textContent ).toMatch( '✅' );
		}
		pass = true;
		message = () => 'Expected logged-in user not to have valid AMP';
	} catch ( error ) {
		pass = false;
		message = () => 'Expected logged-in user to have valid AMP';
	}
	return { pass, message };
}
