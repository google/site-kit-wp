/**
 * `core/location` data store tests.
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { mockLocation } from '../../../../../tests/js/mock-browser-utils';
import { CORE_LOCATION } from './constants';

describe( 'core/location', () => {
	mockLocation();
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'navigateTo', () => {
			it( 'should require a valid URL', () => {
				return expect( () =>
					registry.dispatch( CORE_LOCATION ).navigateTo( 'testurl' )
				).toThrow( 'url must be a valid URI.' );
			} );

			it( 'should use location.assign() function when navigating', async () => {
				const url = 'https://example.com/';

				await registry.dispatch( CORE_LOCATION ).navigateTo( url );

				expect( global.location.assign ).toHaveBeenCalled();
				expect( global.location.assign ).toHaveBeenCalledWith( url );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isNavigating', () => {
			it( 'should return FALSE when not navigating', () => {
				expect( registry.select( CORE_LOCATION ).isNavigating() ).toBe(
					false
				);
			} );

			it( 'should return TRUE when navigating', () => {
				registry
					.dispatch( CORE_LOCATION )
					.navigateTo( 'http://example.com/' );
				expect( registry.select( CORE_LOCATION ).isNavigating() ).toBe(
					true
				);
			} );
		} );

		describe( 'isNavigatingTo', () => {
			it.each( [
				[ '1', 1 ],
				[ 'false', false ],
				[ 'undefined', undefined ],
				[ 'NULL', null ],
				[ 'NaN', NaN ],
				[ 'an URL object', new URL( 'http://example.com/' ) ],
			] )( 'should throw an error if %s is passed', ( name, val ) => {
				expect( () =>
					registry.select( CORE_LOCATION ).isNavigatingTo( val )
				).toThrow(
					'url must be either a string or a regular expression.'
				);
			} );
		} );

		describe( 'getNavigateURL', () => {
			it( 'should return NULL when not navigating', () => {
				expect(
					registry.select( CORE_LOCATION ).getNavigateURL()
				).toBeNull();
			} );

			it( 'should return the current URL when navigating', () => {
				const url = 'http://example.com/';
				registry.dispatch( CORE_LOCATION ).navigateTo( url );
				expect(
					registry.select( CORE_LOCATION ).getNavigateURL()
				).toBe( url );
			} );
		} );
	} );
} );
