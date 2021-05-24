/**
 * URL pathname getter utility function tests.
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
 * Internal dependencies
 */
import { getURLPath, getFullURL, normalizeURL } from './urls';

describe( 'getURLPath', () => {
	it.each( [
		[ '/foobar', 'http://example.com/foobar' ],
		[ '/', 'http://example.com/' ],
		[ '/', 'http://example.com' ],
		[ '/foo/bar.html', 'http://example.com:3333/foo/bar.html?query=string&test#heading' ],
	] )( 'should return %s for %s', ( expected, url ) => {
		expect( getURLPath( url ) ).toBe( expected );
	} );

	it.each( [
		[ 'FALSE', false ],
		[ 'NULL', null ],
		[ 'an empty string', '' ],
		[ 'incomplete URL', 'foo.com/test' ],
	] )( 'should throw an error if "%s" is passed instead of a valid URL', ( _, val ) => {
		expect( () => getURLPath( val ) ).toThrow( 'Invalid URL' );
	} );
} );

describe( 'getFullURL', () => {
	it.each( [
		[ 'https://www.example.com', '', 'https://www.example.com/' ],
		[ 'https://www.example.com', '/path', 'https://www.example.com/path' ],
		[ 'https://www.example.com/slug/slug', '/path', 'https://www.example.com/path' ],
		[ 'https://www.example.com:444/slug/slug', '/path', 'https://www.example.com:444/path' ],
		[ 'https://www.firstexample.com/slug', 'https://www.secondexample.com/path', 'https://www.secondexample.com/path' ],
		[ 'https://www.firstexample.com/slug', 'https://www.secondexample.com:9000/path', 'https://www.secondexample.com:9000/path' ],
	] )( 'should return the correct URL when "%s" and "%s" are passed', ( siteURL, path, expected ) => {
		expect( getFullURL( siteURL, path ) ).toBe( expected );
	} );

	it.each( [
		[ 'falsy site URL and falsy path are passed', false, false ],
		[ 'incomplete URL is passed', '/slug', '/path' ],
		[ 'site URL is passed as path parameter', '', 'https://www.example.com' ],
	] )( 'should throw an error if %s', ( _, siteURL, path ) => {
		expect( () => getFullURL( siteURL, path ) ).toThrow();
	} );
} );

describe( 'normalizeURL', () => {
	it.each( [
		[ 'https://example.com', 'example.com' ],
		[ 'http://example.com/', 'example.com' ],
		[ 'http://www.example.com/', 'example.com' ],
		[ 'http://www.example.com/slug/', 'example.com/slug' ],
	] )( 'should normalize %s to %s', ( url, expected ) => {
		expect( normalizeURL( url ) ).toBe( expected );
	} );
} );
