/**
 * Absolute URL path getter utility function tests.
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
import { getFullURL } from './getFullURL';

describe( 'getFullURL', () => {
	it( 'returns the URL with path', () => {
		expect(
			getFullURL( 'https://www.example.com', '' )
		).toEqual( 'https://www.example.com/' );

		expect(
			getFullURL( 'https://www.example.com', '/path' )
		).toEqual( 'https://www.example.com/path' );

		expect(
			getFullURL( 'https://www.example.com/slug/slug', '/path' )
		).toEqual( 'https://www.example.com/path' );

		expect(
			getFullURL( 'https://www.firstexample.com/slug', 'https://www.secondexample.com/path' )
		).toEqual( 'https://www.secondexample.com/path' );
	} );

	it( 'throws if not a valid URL and/or path', () => {
		expect(
			() => {
				getFullURL( false, false );
			}
		).toThrow( 'Invalid base URL: false' );

		expect(
			() => {
				getFullURL( '/slug', '/path' );
			}
		).toThrow( 'Invalid base URL:' );

		expect(
			() => {
				getFullURL( '', 'https://www.example.com' );
			}
		).toThrow( 'Invalid base URL:' );

		expect(
			() => {
				getFullURL( '/slug', 'https://www.example.com' )
				;
			}
		).toThrow( 'Invalid base URL: /slug' );
	} );
} );
