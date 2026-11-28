/**
 * Traffic Overview report utility tests.
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
import { getMetricValue, getPageURL } from './report';

describe( 'getMetricValue', () => {
	it( 'should return the first metric of the row as a number by default', () => {
		expect(
			getMetricValue( {
				metricValues: [ { value: '76.5' }, { value: '18' } ],
			} )
		).toBe( 76.5 );
	} );

	it( 'should return the metric at the given index', () => {
		expect(
			getMetricValue(
				{ metricValues: [ { value: '76.5' }, { value: '18' } ] },
				1
			)
		).toBe( 18 );
	} );

	it( 'should return 0 for a row that has not loaded or has no such metric', () => {
		expect( getMetricValue( undefined ) ).toBe( 0 );
		expect(
			getMetricValue(
				{ metricValues: [ { value: '76.5' }, { value: '18' } ] },
				2
			)
		).toBe( 0 );
	} );
} );

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

	it( 'should not return a URL for a value that is not a path', () => {
		expect(
			getPageURL( 'https://example.com', '(not set)' )
		).toBeUndefined();
	} );

	it( 'should not return a URL for an empty string', () => {
		expect( getPageURL( 'https://example.com', '' ) ).toBeUndefined();
	} );

	it( 'should not return a URL for a path that starts with two slashes', () => {
		expect(
			getPageURL( 'https://example.com', '//example.org/offer/' )
		).toBeUndefined();
	} );

	it( 'should not return a URL for a path that starts with a slash and a backslash', () => {
		expect(
			getPageURL( 'https://example.com', '/\\example.org/offer/' )
		).toBeUndefined();
	} );

	it( 'should not return a URL when the site URL is not a URL', () => {
		expect( getPageURL( '', '/hello-world/' ) ).toBeUndefined();
	} );
} );
