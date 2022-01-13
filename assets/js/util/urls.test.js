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
import {
	getURLPath,
	getFullURL,
	normalizeURL,
	isHashOnly,
	shortenURL,
} from './urls';

describe( 'getURLPath', () => {
	it.each( [
		[ '/foobar', 'http://example.com/foobar' ],
		[ '/', 'http://example.com/' ],
		[ '/', 'http://example.com' ],
		[
			'/foo/bar.html',
			'http://example.com:3333/foo/bar.html?query=string&test#heading',
		],
	] )( 'should return %s for %s', ( expected, url ) => {
		expect( getURLPath( url ) ).toBe( expected );
	} );

	it.each( [
		[ 'FALSE', false ],
		[ 'NULL', null ],
		[ 'an empty string', '' ],
		[ 'incomplete URL', 'foo.com/test' ],
	] )(
		'should return NULL if "%s" is passed instead of a valid URL',
		( _, val ) => {
			expect( getURLPath( val ) ).toBeNull();
		}
	);
} );

describe( 'getFullURL', () => {
	it.each( [
		[ 'https://www.example.com', '', 'https://www.example.com/' ],
		[ 'https://www.example.com', '/path', 'https://www.example.com/path' ],
		[
			'https://www.example.com/slug/slug',
			'/path',
			'https://www.example.com/path',
		],
		[
			'https://www.example.com:444/slug/slug',
			'/path',
			'https://www.example.com:444/path',
		],
		[
			'https://www.firstexample.com/slug',
			'https://www.secondexample.com/path',
			'https://www.secondexample.com/path',
		],
		[
			'https://www.firstexample.com/slug',
			'https://www.secondexample.com:9000/path',
			'https://www.secondexample.com:9000/path',
		],
	] )(
		'should return the correct URL when "%s" and "%s" are passed',
		( siteURL, path, expected ) => {
			expect( getFullURL( siteURL, path ) ).toBe( expected );
		}
	);

	it.each( [
		[ 'falsy site URL and falsy path are passed', false, false, '' ],
		[ 'incomplete URL is passed', '/slug', '/path', '/slug/path' ],
		[
			'site URL is passed as path parameter',
			'',
			'https://www.example.com',
			'https://www.example.com',
		],
	] )(
		'should return the concatenated URL if %s',
		( _, siteURL, path, expected ) => {
			expect( getFullURL( siteURL, path ) ).toBe( expected );
		}
	);
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

describe( 'isHashOnly', () => {
	it.each( [
		[ true, '#hash' ],
		[ true, '#some-hash' ],
		[ true, '#some-hash-123' ],
		[ false, 'https://some.url.com/' ],
		[ false, 'http://example.com/sample-page#some-hash' ],
		[ false, 'http://example.com/sample-page#somehash' ],
		[ false, 'http://example.com/#some-hash' ],
		[
			false,
			'http://example.com/sample-page#some-hash?id=20&product=test',
		],
	] )( 'should return %s for %s', ( expected, string ) => {
		expect( isHashOnly( string ) ).toBe( expected );
	} );
} );

describe( 'shortenURL', () => {
	it.each( [
		[ undefined, undefined, undefined ],
		[ null, null, null ],
		[ '', 0, '' ],
	] )(
		'should not modify %s which is an invalid URL and return safely',
		( url, maxChars, expected ) => {
			expect( shortenURL( url, maxChars ) ).toBe( expected );
		}
	);

	it.each( [
		[
			'http://domain.com/a-short-path',
			30,
			'http://domain.com/a-short-path',
		],
		[ 'http://domain.com/short-path', 30, 'http://domain.com/short-path' ],
	] )(
		'should not modify URLs shorter than or equal to maxChars',
		( url, maxChars, expected ) => {
			expect( shortenURL( url, maxChars ) ).toBe( expected );
		}
	);

	it.each( [
		[
			'https://www.very-long-domain-name.com/some-directory/some-file',
			30,
			'/some-directory/some-file',
		],
		[
			'https://www.domain.com/some-directory/some-directory/some-file',
			30,
			'…tory/some-directory/some-file',
		],
		[
			'https://www.domain.com/some-directory/some-directory/some-file?id=1&category=test',
			50,
			'…ctory/some-directory/some-file?id=1&category=test', // 50 chars.
		],
		[
			'https://www.domain.com/some-directory/some-directory/some-file?id=1&category=test#some-hash',
			50.456,
			'…-directory/some-file?id=1&category=test#some-hash', // 50 chars.
		],
	] )(
		'should shorten %s to %s chars, shortening it to %s',
		( url, maxChars, expected ) => {
			expect( shortenURL( url, maxChars ) ).toBe( expected );
		}
	);
} );
