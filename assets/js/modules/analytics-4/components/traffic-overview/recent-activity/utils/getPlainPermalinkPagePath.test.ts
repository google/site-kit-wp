/**
 * Recent activity plain permalink page path helper tests.
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
 * Internal dependencies
 */
import { getPlainPermalinkPagePath } from './getPlainPermalinkPagePath';

describe( 'getPlainPermalinkPagePath', () => {
	it( 'should return the home path with the public query vars of a URL at the home path', () => {
		expect(
			getPlainPermalinkPagePath( '/?p=1', 'https://example.com/', [
				'p',
			] )
		).toEqual( '/?p=1' );
	} );

	it( 'should leave out each query arg that is not a public query var', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?utm_source=newsletter&p=1&fbclid=abc',
				'https://example.com/',
				[ 'p' ]
			)
		).toEqual( '/?p=1' );
	} );

	it( 'should keep the public query vars in the order of the URL', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?post_type=book&p=5',
				'https://example.com/',
				[ 'p', 'post_type' ]
			)
		).toEqual( '/?post_type=book&p=5' );
	} );

	it( 'should read `index.php` at the home path as the home path', () => {
		expect(
			getPlainPermalinkPagePath(
				'/index.php?p=1',
				'https://example.com/',
				[ 'p' ]
			)
		).toEqual( '/?p=1' );
	} );

	it( 'should return the home path for a URL with no public query var', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?utm_source=newsletter',
				'https://example.com/',
				[ 'p' ]
			)
		).toEqual( '/' );
	} );

	it( 'should leave out a public query var with an empty value, which WordPress ignores', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?p=&page_id=2',
				'https://example.com/',
				[ 'p', 'page_id' ]
			)
		).toEqual( '/?page_id=2' );
	} );

	it( 'should keep an empty `s` query var, which WordPress still reads as a search', () => {
		expect(
			getPlainPermalinkPagePath( '/?s=', 'https://example.com/', [ 's' ] )
		).toEqual( '/?s=' );
	} );

	it( 'should return the page path under the home path of a site in a subdirectory, such as `/blog/?p=1` for `/blog/index.php?p=1`', () => {
		expect(
			getPlainPermalinkPagePath(
				'/blog/index.php?p=1',
				'https://example.com/blog/',
				[ 'p' ]
			)
		).toEqual( '/blog/?p=1' );
	} );

	it( 'should return `null` for a URL outside the home path of a site in a subdirectory', () => {
		expect(
			getPlainPermalinkPagePath( '/?p=1', 'https://example.com/blog/', [
				'p',
			] )
		).toBeNull();
	} );

	it( 'should return `null` for a URL at another path below the home path', () => {
		expect(
			getPlainPermalinkPagePath(
				'/blog/forum/?p=1',
				'https://example.com/blog/',
				[ 'p' ]
			)
		).toBeNull();
	} );

	it( 'should read the home path of a site URL that has no trailing slash', () => {
		expect(
			getPlainPermalinkPagePath(
				'/blog/?p=1',
				'https://example.com/blog',
				[ 'p' ]
			)
		).toEqual( '/blog/?p=1' );
	} );

	it( 'should return `null` for a value that is not a path', () => {
		expect(
			getPlainPermalinkPagePath( '(not set)', 'https://example.com/', [
				'p',
			] )
		).toBeNull();
	} );

	it( 'should return `null` for a path that starts with two slashes, which resolves to another site', () => {
		expect(
			getPlainPermalinkPagePath(
				'//example.org/?p=1',
				'https://example.com/',
				[ 'p' ]
			)
		).toBeNull();
	} );

	it( 'should return `null` for a path that starts with a slash and a backslash, which resolves to another site', () => {
		expect(
			getPlainPermalinkPagePath(
				'/\\example.org/?p=1',
				'https://example.com/',
				[ 'p' ]
			)
		).toBeNull();
	} );
} );
