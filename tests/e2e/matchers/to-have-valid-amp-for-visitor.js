/**
 * `toHaveValidAMPForVisitor` matcher.
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
import ampHTMLValidator from 'amphtml-validator';
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
 * Determines if the path has valid AMP for visitors (not logged in).
 *
 * @since 1.10.0
 *
 * @param {(string|Object)} path The string URI or page object.
 * @return {Object} Matcher results.
 */
export async function toHaveValidAMPForVisitor( path ) {
	const urlToFetch =
		'object' === typeof path ? path.url() : createURL( path );

	const html = await fetchPageContent( urlToFetch, {
		credentials: 'omit',
		timeout: 10000, // Fetching and evaluating the page is a slow operation so allow additional time to prevent timeouts in CI.
	} );
	// Make sure the admin bar is not present.
	const jsDoc = new JSDOM( html ).window.document;
	if ( jsDoc.querySelector( '#wpadminbar' ) ) {
		throw new Error(
			'toHaveValidAMPForVisitor failed. The admin bar was found.'
		);
	}
	const validator = await ampHTMLValidator.getInstance();
	const { status } = validator.validateString( html );
	const pass = 'PASS' === status;
	const message = () => `AMP Status: ${ status }`;

	return { pass, message };
}
