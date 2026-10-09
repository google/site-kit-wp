/**
 * Recent activity page URL helper tests.
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
import { getPageURL } from './getPageURL';

describe( 'getPageURL', () => {
	it( 'should return the URL of the page on the site', () => {
		expect( getPageURL( 'https://example.com', '/hello-world/' ) ).toBe(
			'https://example.com/hello-world/'
		);
	} );

	it( 'should keep the path whole for a site in a subdirectory, since a page path starts at the root of the domain', () => {
		expect(
			getPageURL( 'https://example.com/blog', '/blog/hello-world/' )
		).toBe( 'https://example.com/blog/hello-world/' );
	} );

	it( 'should keep the query of the page path', () => {
		expect( getPageURL( 'https://example.com', '/?p=12' ) ).toBe(
			'https://example.com/?p=12'
		);
	} );

	it.each( [
		[ 'a value that is not a path', '(not set)' ],
		[ 'an empty value', '' ],
		[ 'a path that starts with two slashes', '//example.org/offer/' ],
		[ 'a path that starts with a backslash', '/\\example.org/offer/' ],
	] )( 'should return no URL for %s', ( _, pagePath ) => {
		expect( getPageURL( 'https://example.com', pagePath ) ).toBeUndefined();
	} );

	it( 'should return no URL when the site URL is not a URL', () => {
		expect( getPageURL( '', '/hello-world/' ) ).toBeUndefined();
	} );
} );
