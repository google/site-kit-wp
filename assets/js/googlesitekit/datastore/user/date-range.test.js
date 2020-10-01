/**
 * User info data store: date-range.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { STORE_NAME } from './constants';

describe( 'core/user date-range', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setDateRange', () => {
			it( 'should require the date range slug param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setDateRange();
				} ).toThrow( 'Date range slug is required.' );
			} );

			it( 'should set the date range', () => {
				const someDateRange = 'last-14-days';

				registry.dispatch( STORE_NAME ).setDateRange( someDateRange );
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( someDateRange );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getDateRange', () => {
			it( 'should return the date range once set', () => {
				const someDateRange = 'last-7-days';

				registry.dispatch( STORE_NAME ).setDateRange( someDateRange );
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( someDateRange );
			} );

			it( 'should return "last-28-days" when no date range is set', () => {
				expect( registry.select( STORE_NAME ).getDateRange() ).toEqual( 'last-28-days' );
			} );
		} );
	} );
} );
