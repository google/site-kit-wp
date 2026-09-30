/**
 * PDF export utilities tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPDFFilename } from './pdf-utils';

jest.mock( '@wordpress/i18n', () => {
	const actual = jest.requireActual( '@wordpress/i18n' );
	return {
		...actual,
		__: jest.fn( actual.__ ),
	};
} );

describe( 'getPDFFilename', () => {
	const siteURL = 'https://example.com/blog/';

	it( 'should show the month and year once for a range within one month', () => {
		expect(
			getPDFFilename( siteURL, {
				startDate: '2026-03-01',
				endDate: '2026-03-07',
			} )
		).toBe( 'Site Kit Dashboard - example.com - Mar 1 – 7, 2026.pdf' );
	} );

	it( 'should show both months for a range spanning two months', () => {
		expect(
			getPDFFilename( siteURL, {
				startDate: '2026-02-23',
				endDate: '2026-03-01',
			} )
		).toBe( 'Site Kit Dashboard - example.com - Feb 23 – Mar 1, 2026.pdf' );
	} );

	it( 'should show both full dates for a range spanning two years', () => {
		expect(
			getPDFFilename( siteURL, {
				startDate: '2025-12-28',
				endDate: '2026-01-03',
			} )
		).toBe(
			'Site Kit Dashboard - example.com - Dec 28, 2025 – Jan 3, 2026.pdf'
		);
	} );

	it( 'should take the host from the site URL without the scheme and path', () => {
		expect(
			getPDFFilename( 'https://www.example.com/blog/', {
				startDate: '2026-03-01',
				endDate: '2026-03-07',
			} )
		).toBe( 'Site Kit Dashboard - www.example.com - Mar 1 – 7, 2026.pdf' );
	} );

	it( 'should use the report segment when the site URL cannot be parsed', () => {
		expect(
			getPDFFilename( 'not a url', {
				startDate: '2026-03-01',
				endDate: '2026-03-07',
			} )
		).toBe( 'Site Kit Dashboard - report - Mar 1 – 7, 2026.pdf' );
	} );

	it( 'should drop the date range when the start date is invalid', () => {
		expect(
			getPDFFilename( siteURL, {
				startDate: 'invalid',
				endDate: '2026-03-07',
			} )
		).toBe( 'Site Kit Dashboard - example.com.pdf' );
	} );

	it( 'should drop the date range when the end date is invalid', () => {
		expect(
			getPDFFilename( siteURL, {
				startDate: '2026-03-01',
				endDate: '',
			} )
		).toBe( 'Site Kit Dashboard - example.com.pdf' );
	} );

	it( 'should strip the characters filesystems reject', () => {
		// A translation of the prefix can contain reserved characters.
		( __ as jest.Mock ).mockReturnValueOnce(
			'"Site Kit" <Dashboard>: \\/*?|\t\u0000\u001f\u007f'
		);

		expect(
			getPDFFilename( 'http://localhost:8080/', {
				startDate: '2026-03-01',
				endDate: '2026-03-07',
			} )
		).toBe( 'Site Kit Dashboard - localhost8080 - Mar 1 – 7, 2026.pdf' );
	} );

	it( 'should strip trailing dots and spaces from the name', () => {
		expect(
			getPDFFilename( 'https://example.com./', {
				startDate: '',
				endDate: '',
			} )
		).toBe( 'Site Kit Dashboard - example.com.pdf' );
	} );
} );
