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
	it( 'should return the home path followed by the query vars WordPress reads, in the order of the list', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?page=2&utm_source=newsletter&p=123',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/?p=123&page=2' );
	} );

	it( 'should return the same page path for a URL at `index.php`', () => {
		expect(
			getPlainPermalinkPagePath(
				'/index.php?p=123',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/?p=123' );
	} );

	it( 'should return the home path for a URL with no query var WordPress reads', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?utm_source=newsletter&fbclid=abc',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/' );
	} );

	it( 'should return the home path for the home page', () => {
		expect(
			getPlainPermalinkPagePath( '/', 'https://example.com', [
				'p',
				's',
				'page',
				'page_id',
				'product',
			] )
		).toBe( '/' );
	} );

	it( 'should keep the last value of a query var that the URL repeats', () => {
		expect(
			getPlainPermalinkPagePath( '/?p=12&p=34', 'https://example.com', [
				'p',
				's',
				'page',
				'page_id',
				'product',
			] )
		).toBe( '/?p=34' );
	} );

	it( 'should decode a query var and encode it again', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?s=winter+hats',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/?s=winter%20hats' );
	} );

	it( 'should keep a slug with encoded characters', () => {
		expect(
			getPlainPermalinkPagePath(
				'/?product=%D8%B3%D9%84%D8%A7%D9%85&utm_source=newsletter',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/?product=%D8%B3%D9%84%D8%A7%D9%85' );
	} );

	it( 'should return the page path under the home path of a site in a subdirectory', () => {
		expect(
			getPlainPermalinkPagePath(
				'/blog/?p=123',
				'https://example.com/blog/',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/blog/?p=123' );
	} );

	it( 'should return the page path for a URL at the home path of a site in a subdirectory without its last slash', () => {
		expect(
			getPlainPermalinkPagePath(
				'/blog?p=123',
				'https://example.com/blog',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBe( '/blog/?p=123' );
	} );

	it( 'should return `undefined` for a URL at a path other than the home path', () => {
		expect(
			getPlainPermalinkPagePath( '/shop/?p=123', 'https://example.com', [
				'p',
				's',
				'page',
				'page_id',
				'product',
			] )
		).toBeUndefined();
	} );

	it( 'should return `undefined` for a URL above the home path of a site in a subdirectory', () => {
		expect(
			getPlainPermalinkPagePath( '/?p=123', 'https://example.com/blog/', [
				'p',
				's',
				'page',
				'page_id',
				'product',
			] )
		).toBeUndefined();
	} );

	it( 'should return `undefined` for a URL on another origin', () => {
		expect(
			getPlainPermalinkPagePath(
				'//example.org/?p=123',
				'https://example.com',
				[ 'p', 's', 'page', 'page_id', 'product' ]
			)
		).toBeUndefined();
	} );

	it( 'should return `undefined` for a value that Analytics records for a page with no path', () => {
		expect(
			getPlainPermalinkPagePath( '(not set)', 'https://example.com', [
				'p',
				's',
				'page',
				'page_id',
				'product',
			] )
		).toBeUndefined();
	} );
} );
