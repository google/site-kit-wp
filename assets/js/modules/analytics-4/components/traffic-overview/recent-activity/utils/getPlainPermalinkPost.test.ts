/**
 * Recent activity plain permalink post helper tests.
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
import { getPlainPermalinkPost } from './getPlainPermalinkPost';

describe( 'getPlainPermalinkPost', () => {
	it( 'returns the post that the `p` query var names', () => {
		expect(
			getPlainPermalinkPost( '/?p=123', 'https://example.com' )
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'returns the page that the `page_id` query var names', () => {
		expect(
			getPlainPermalinkPost( '/?page_id=45', 'https://example.com' )
		).toEqual( { type: 'page', id: 45, path: '/?page_id=45' } );
	} );

	it( 'returns the post with the permalink that WordPress builds for it when the URL has more query vars', () => {
		expect(
			getPlainPermalinkPost(
				'/?utm_source=newsletter&p=123&utm_medium=email',
				'https://example.com'
			)
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'returns the post that the `p` query var names when `post_type` is `post`', () => {
		expect(
			getPlainPermalinkPost(
				'/?post_type=post&p=123',
				'https://example.com'
			)
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'returns the page that the `p` query var names when `post_type` is `page`', () => {
		expect(
			getPlainPermalinkPost(
				'/?post_type=page&p=45',
				'https://example.com'
			)
		).toEqual( { type: 'page', id: 45, path: '/?page_id=45' } );
	} );

	it( 'returns the post that the `p` query var names when the URL also has the `page_id` query var, the way WordPress reads it', () => {
		expect(
			getPlainPermalinkPost( '/?page_id=45&p=123', 'https://example.com' )
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'reads the last value of a query var that the URL repeats, the way PHP reads it', () => {
		expect(
			getPlainPermalinkPost( '/?p=12&p=123', 'https://example.com' )
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'returns the post for a URL at the `index.php` file of the home URL', () => {
		expect(
			getPlainPermalinkPost( '/index.php?p=123', 'https://example.com' )
		).toEqual( { type: 'post', id: 123, path: '/?p=123' } );
	} );

	it( 'returns the post with the path of a home URL in a folder', () => {
		expect(
			getPlainPermalinkPost( '/blog/?p=123', 'https://example.com/blog' )
		).toEqual( { type: 'post', id: 123, path: '/blog/?p=123' } );
	} );

	it( 'returns the post for a URL at a home URL in a folder without its last slash', () => {
		expect(
			getPlainPermalinkPost( '/blog?p=123', 'https://example.com/blog/' )
		).toEqual( { type: 'post', id: 123, path: '/blog/?p=123' } );
	} );

	it( 'returns `undefined` for a URL outside the folder of the home URL', () => {
		expect(
			getPlainPermalinkPost( '/?p=123', 'https://example.com/blog' )
		).toBeUndefined();
	} );

	it( "returns `undefined` for a URL at another path, which WordPress doesn't answer", () => {
		expect(
			getPlainPermalinkPost(
				'/forum/viewtopic.php?p=123',
				'https://example.com'
			)
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a page path that resolves to another site', () => {
		expect(
			getPlainPermalinkPost(
				'//spam.example/?p=123',
				'https://example.com'
			)
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a product, which the product query var names', () => {
		expect(
			getPlainPermalinkPost( '/?product=hoodie', 'https://example.com' )
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a post of another post type, such as a product', () => {
		expect(
			getPlainPermalinkPost(
				'/?post_type=product&p=31',
				'https://example.com'
			)
		).toBeUndefined();
	} );

	it( 'returns `undefined` for the home page', () => {
		expect(
			getPlainPermalinkPost( '/', 'https://example.com' )
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a search', () => {
		expect(
			getPlainPermalinkPost( '/?s=ice+cream', 'https://example.com' )
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a `p` query var of `0`', () => {
		expect(
			getPlainPermalinkPost( '/?p=0', 'https://example.com' )
		).toBeUndefined();
	} );

	it( 'returns `undefined` for a negative `p` query var', () => {
		expect(
			getPlainPermalinkPost( '/?p=-123', 'https://example.com' )
		).toBeUndefined();
	} );

	it( "returns `undefined` for a `p` query var that isn't a number", () => {
		expect(
			getPlainPermalinkPost( '/?p=hello', 'https://example.com' )
		).toBeUndefined();
	} );

	it( "returns `undefined` for a page path that isn't a URL path, such as `(not set)`", () => {
		expect(
			getPlainPermalinkPost( '(not set)', 'https://example.com' )
		).toBeUndefined();
	} );

	it( "returns `undefined` when the site URL isn't a URL", () => {
		expect( getPlainPermalinkPost( '/?p=123', '' ) ).toBeUndefined();
	} );
} );
