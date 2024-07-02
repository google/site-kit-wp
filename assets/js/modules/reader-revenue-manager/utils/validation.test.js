/**
 * Validation function tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import { isValidPublicationID, isURLUsingHTTPS } from './validation';

describe( 'utility functions', () => {
	describe( 'isValidPublicationID', () => {
		it( 'should return TRUE when a valid publication ID is passed', () => {
			expect( isValidPublicationID( 'valid-publication_123.ID' ) ).toBe(
				true
			);
		} );

		it.each( [
			[ 'false', false ],
			[ 'an integer', 12345 ],
			[ 'an empty string', '' ],
			[ 'a string with invalid characters', 'invalid-publication!ID' ],
		] )( 'should return FALSE when %s is passed', ( _, publicationID ) => {
			expect( isValidPublicationID( publicationID ) ).toBe( false );
		} );
	} );

	describe( 'isURLUsingHTTPS', () => {
		beforeAll( () => {
			jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
		} );

		afterAll( () => {
			// eslint-disable-next-line no-console
			console.warn.mockRestore();
		} );

		afterEach( () => {
			// eslint-disable-next-line no-console
			console.warn.mockClear();
		} );

		it( 'should return TRUE when a URL with HTTPS is passed', () => {
			expect( isURLUsingHTTPS( 'https://example.com' ) ).toBe( true );
			// eslint-disable-next-line no-console
			expect( console.warn ).not.toHaveBeenCalled();
		} );

		it.each( [
			[ 'an HTTP URL', 'http://example.com' ],
			[ 'an invalid URL', 'htp://example.com' ],
			[ 'a string without protocol', 'example.com' ],
			[ 'an empty string', '' ],
			[ 'false', false ],
		] )( 'should return FALSE when %s is passed', ( _, url ) => {
			expect( isURLUsingHTTPS( url ) ).toBe( false );
			// eslint-disable-next-line no-console
			expect( console.warn ).toHaveBeenCalled();
		} );
	} );
} );
