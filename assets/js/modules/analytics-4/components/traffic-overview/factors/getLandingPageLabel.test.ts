/**
 * Key factor landing page label helper tests.
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
import { getLandingPageLabel } from './getLandingPageLabel';

describe( 'getLandingPageLabel', () => {
	it( 'should name `/` "Homepage" on a site at the root of its domain', () => {
		expect( getLandingPageLabel( '/', 'https://example.com' ) ).toBe(
			'Homepage'
		);
	} );

	it.each( [ '/blog/', '/blog' ] )(
		'should name the folder of a site that lives under one "Homepage", as `%s`',
		( pagePath ) => {
			expect(
				getLandingPageLabel( pagePath, 'https://example.com/blog' )
			).toBe( 'Homepage' );
		}
	);

	it.each( [
		[
			'any other page on a site at the root of its domain',
			'/hello-world/',
			'https://example.com',
		],
		[
			'any other page on a site that lives under a folder',
			'/blog/hello-world/',
			'https://example.com/blog',
		],
		[
			'the root of the domain on a site that lives under a folder',
			'/',
			'https://example.com/blog',
		],
		[
			'a path with a query, such as a post with a plain permalink',
			'/?p=12',
			'https://example.com',
		],
		[
			'a spam path that resolves to another site',
			'//example.org/',
			'https://example.com',
		],
	] )( 'should name %s by its path', ( _, pagePath, siteURL ) => {
		expect( getLandingPageLabel( pagePath, siteURL ) ).toBe( pagePath );
	} );

	it( 'should name `/` "Homepage", and any other page by its path, when the site’s URL is unknown', () => {
		expect( getLandingPageLabel( '/' ) ).toBe( 'Homepage' );
		expect( getLandingPageLabel( '/blog/' ) ).toBe( '/blog/' );
	} );
} );
