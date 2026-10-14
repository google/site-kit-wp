/**
 * Traffic Overview `useFreshDataDateRange` hook tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { stringToDate } from '@/js/util';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import { provideTimezone } from '@tests/js/utils';
import { useFreshDataDateRange } from './useFreshDataDateRange';

describe( 'useFreshDataDateRange', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( 'should return a date range from two days before the reference date to the reference date', () => {
		const { result } = renderHook( () => useFreshDataDateRange(), {
			registry,
		} );

		expect( result.current ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return the same date range when the user selects another date range for the dashboard', () => {
		const { result } = renderHook( () => useFreshDataDateRange(), {
			registry,
		} );

		act( () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
		} );

		expect( registry.select( CORE_USER ).getDateRangeDates() ).toEqual( {
			startDate: '2025-01-30',
			endDate: '2025-02-05',
		} );
		expect( result.current ).toEqual( {
			startDate: '2025-02-03',
			endDate: '2025-02-05',
		} );
	} );

	it( 'should return a date range that ends on the new reference date when the reference date changes', () => {
		const { result } = renderHook( () => useFreshDataDateRange(), {
			registry,
		} );

		act( () => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2025-07-10' );
		} );

		expect( result.current ).toEqual( {
			startDate: '2025-07-08',
			endDate: '2025-07-10',
		} );
	} );

	it( 'should start the date range two calendar days before the reference date when the clocks went forward in between', () => {
		const originalTimezone = provideTimezone( 'America/New_York' );

		try {
			// The clocks in New York went forward on 9 March 2025.
			expect( stringToDate( '2025-03-08' ).getTimezoneOffset() ).toBe(
				300
			);
			expect( stringToDate( '2025-03-10' ).getTimezoneOffset() ).toBe(
				240
			);

			registry.dispatch( CORE_USER ).setReferenceDate( '2025-03-10' );

			const { result } = renderHook( () => useFreshDataDateRange(), {
				registry,
			} );

			expect( result.current ).toEqual( {
				startDate: '2025-03-08',
				endDate: '2025-03-10',
			} );
		} finally {
			provideTimezone( originalTimezone );
		}
	} );
} );
