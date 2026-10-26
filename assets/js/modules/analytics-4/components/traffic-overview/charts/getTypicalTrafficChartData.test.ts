/**
 * `getTypicalTrafficChartData` tests.
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
import { createDailyTrafficRows } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { getTypicalTrafficChartData } from './getTypicalTrafficChartData';

describe( 'getTypicalTrafficChartData', () => {
	it( 'should return one point for each of 28 rows, oldest first, with a day of 0 visitors as a point at 0', () => {
		// The second day has no visitors.
		const dailyTraffic = createDailyTrafficRows(
			28,
			'2026-09-15',
			( dayIndex ) => ( dayIndex === 1 ? 0 : 50 )
		);

		const [ , ...points ] = getTypicalTrafficChartData( {
			dailyTraffic,
		} ).chartData;

		expect( points ).toHaveLength( 28 );
		expect( points.slice( 0, 3 ) ).toEqual( [
			[ new Date( 2026, 7, 19 ), 50 ],
			[ new Date( 2026, 7, 20 ), 0 ],
			[ new Date( 2026, 7, 21 ), 50 ],
		] );
		expect( points[ 27 ] ).toEqual( [ new Date( 2026, 8, 15 ), 50 ] );
	} );

	it( 'should label the number column "Visits"', () => {
		const dailyTraffic = createDailyTrafficRows(
			28,
			'2026-09-15',
			() => 50
		);

		const [ columns ] = getTypicalTrafficChartData( {
			dailyTraffic,
		} ).chartData;

		expect( columns ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Visits' },
		] );
	} );

	it( 'should return the date of every day but the first as `ticks`', () => {
		const dailyTraffic = createDailyTrafficRows(
			28,
			'2026-09-15',
			() => 50
		);

		const { ticks } = getTypicalTrafficChartData( { dailyTraffic } );

		expect( ticks ).toHaveLength( 27 );
		expect( ticks[ 0 ] ).toEqual( new Date( 2026, 7, 20 ) );
		expect( ticks[ 26 ] ).toEqual( new Date( 2026, 8, 15 ) );
	} );

	it( 'should return true as `hasVisitors` when one day has visitors', () => {
		// Only the tenth day has visitors, so neither end of the rows decides it.
		const dailyTraffic = createDailyTrafficRows(
			28,
			'2026-09-15',
			( dayIndex ) => ( dayIndex === 9 ? 120 : 0 )
		);

		const { hasVisitors } = getTypicalTrafficChartData( { dailyTraffic } );

		expect( hasVisitors ).toBe( true );
	} );

	it( 'should return false as `hasVisitors` when every day has 0 visitors', () => {
		const dailyTraffic = createDailyTrafficRows(
			28,
			'2026-09-15',
			() => 0
		);

		const { hasVisitors } = getTypicalTrafficChartData( { dailyTraffic } );

		expect( hasVisitors ).toBe( false );
	} );
} );
