/**
 * Typical Traffic Overview date range utility tests.
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
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import {
	getTypicalTrafficLatestDate,
	selectTypicalTrafficDateRange,
} from './date-range';

describe( 'getTypicalTrafficLatestDate', () => {
	it.each( [
		[ '2025-02-05', '2025-02-04' ],
		[ '2025-03-01', '2025-02-28' ],
		[ '2025-01-01', '2024-12-31' ],
	] )(
		'should give the day before the reference date %s',
		( referenceDate, latestDate ) => {
			expect( getTypicalTrafficLatestDate( referenceDate ) ).toBe(
				latestDate
			);
		}
	);
} );

describe( 'selectTypicalTrafficDateRange', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
	} );

	it( 'should end a preset on the day before the reference date, keeping its length', () => {
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );

		expect(
			selectTypicalTrafficDateRange( registry.select as Select )
		).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			compareStartDate: '2024-12-11',
			compareEndDate: '2025-01-07',
			days: 28,
			latestDate: '2025-02-04',
		} );
	} );

	it( 'should end the month of the reference date on the day before it', () => {
		registry.dispatch( CORE_USER ).setDateRangeSelection( {
			type: 'calendarMonth',
			month: '2025-02',
		} );

		expect(
			selectTypicalTrafficDateRange( registry.select as Select )
		).toEqual( {
			startDate: '2025-02-01',
			endDate: '2025-02-04',
			compareStartDate: '2025-01-28',
			compareEndDate: '2025-01-31',
			days: 4,
			latestDate: '2025-02-04',
		} );
	} );

	it( 'should end a custom range that reaches the reference date on the day before it', () => {
		registry.dispatch( CORE_USER ).setDateRangeSelection( {
			type: 'custom',
			startDate: '2025-01-20',
			endDate: '2025-02-05',
		} );

		expect(
			selectTypicalTrafficDateRange( registry.select as Select )
		).toMatchObject( {
			startDate: '2025-01-20',
			endDate: '2025-02-04',
			days: 16,
		} );
	} );

	it( 'should keep a custom range that ends before the reference date', () => {
		registry.dispatch( CORE_USER ).setDateRangeSelection( {
			type: 'custom',
			startDate: '2025-01-01',
			endDate: '2025-01-31',
		} );

		expect(
			selectTypicalTrafficDateRange( registry.select as Select )
		).toEqual( {
			startDate: '2025-01-01',
			endDate: '2025-01-31',
			compareStartDate: '2024-12-01',
			compareEndDate: '2024-12-31',
			days: 31,
			latestDate: '2025-02-04',
		} );
	} );
} );
