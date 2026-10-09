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
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import {
	getFreshDataDateRange,
	useFreshDataDateRange,
} from './useFreshDataDateRange';

describe( 'getFreshDataDateRange', () => {
	it( 'should return a date range from two days before the reference date to the reference date', () => {
		expect( getFreshDataDateRange( '2025-03-01' ) ).toEqual( {
			startDate: '2025-02-27',
			endDate: '2025-03-01',
		} );
	} );
} );

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
} );
