/**
 * Escape URI components utility tests.
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
import { getURLPath } from './getURLPath';

describe( 'getURLPath', () => {
	it( 'returns only the path of a URL', () => {
		expect(
			getURLPath( 'http://example.com/foobar' )
		).toEqual( '/foobar' );

		expect(
			getURLPath( 'http://example.com/' )
		).toEqual( '/' );

		expect(
			getURLPath( 'http://example.com' )
		).toEqual( '/' );

		expect(
			getURLPath( 'http://example.com:3333/foo/bar.html?query=string&test#heading' )
		).toEqual( '/foo/bar.html' );
	} );

	it( 'throws if not a valid URL', () => {
		expect(
			() => {
				getURLPath( false )
				;
			}
		).toThrow( 'Invalid URL' );

		expect(
			() => {
				getURLPath( null )
				;
			}
		).toThrow( 'Invalid URL' );

		expect(
			() => {
				getURLPath( '' )
				;
			}
		).toThrow( 'Invalid URL' );

		expect(
			() => {
				getURLPath( 'foo.com/test' )
				;
			}
		).toThrow( 'Invalid URL' );
	} );
} );
