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
	it( 'should return one point per row in date order, with a day of 0 visitors as a point at 0', () => {
		// Every seventh day, from the first, has no visitors.
		const dailyTraffic = createDailyTrafficRows(
			'2026-09-15',
			( dayIndex ) => ( dayIndex % 7 === 0 ? 0 : 50 )
		);

		const { chartData } = getTypicalTrafficChartData( { dailyTraffic } );
		const [ columns, ...points ] = chartData;

		expect( columns ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
		] );
		expect( points ).toHaveLength( 395 );
		expect( points.slice( 0, 3 ) ).toEqual( [
			[ new Date( 2025, 7, 17 ), 0 ],
			[ new Date( 2025, 7, 18 ), 50 ],
			[ new Date( 2025, 7, 19 ), 50 ],
		] );
		expect( points[ 394 ] ).toEqual( [ new Date( 2026, 8, 15 ), 50 ] );
		points.slice( 1 ).forEach( ( [ day ], index ) => {
			expect( day.getTime() ).toBeGreaterThan(
				points[ index ][ 0 ].getTime()
			);
		} );
	} );

	it( 'should keep a point for each day of the first weeks when they have no visitors', () => {
		// The first 42 days have no visitors.
		const dailyTraffic = createDailyTrafficRows(
			'2026-09-15',
			( dayIndex ) => ( dayIndex < 42 ? 0 : 80 )
		);

		const { chartData } = getTypicalTrafficChartData( { dailyTraffic } );
		const [ , ...points ] = chartData;

		expect( points ).toHaveLength( 395 );
		expect(
			points.slice( 0, 42 ).map( ( [ , visitors ] ) => visitors )
		).toEqual( Array( 42 ).fill( 0 ) );
		expect( points[ 42 ] ).toEqual( [ new Date( 2025, 8, 28 ), 80 ] );
	} );

	it( 'should place a tick on the first day of each month in the window, and on no other day', () => {
		const dailyTraffic = createDailyTrafficRows( '2026-09-15', () => 10 );

		const { ticks } = getTypicalTrafficChartData( { dailyTraffic } );

		expect( ticks ).toEqual( [
			new Date( 2025, 8, 1 ),
			new Date( 2025, 9, 1 ),
			new Date( 2025, 10, 1 ),
			new Date( 2025, 11, 1 ),
			new Date( 2026, 0, 1 ),
			new Date( 2026, 1, 1 ),
			new Date( 2026, 2, 1 ),
			new Date( 2026, 3, 1 ),
			new Date( 2026, 4, 1 ),
			new Date( 2026, 5, 1 ),
			new Date( 2026, 6, 1 ),
			new Date( 2026, 7, 1 ),
			new Date( 2026, 8, 1 ),
		] );
	} );

	it( 'should return the most visitors on any day, including a peak eleven months before the last day', () => {
		const dailyTraffic = createDailyTrafficRows(
			'2026-09-15',
			( _dayIndex, date ) => ( date === '2025-10-15' ? 900 : 100 )
		);

		const { maximumVisitors } = getTypicalTrafficChartData( {
			dailyTraffic,
		} );

		expect( maximumVisitors ).toBe( 900 );
	} );

	it( 'should return 0 as the most visitors when every day has none', () => {
		const dailyTraffic = createDailyTrafficRows( '2026-09-15', () => 0 );

		const { maximumVisitors } = getTypicalTrafficChartData( {
			dailyTraffic,
		} );

		expect( maximumVisitors ).toBe( 0 );
	} );

	it( 'should return the dates of the first and the last row as the window', () => {
		const dailyTraffic = createDailyTrafficRows( '2026-09-15', () => 10 );

		const { windowStartDate, windowEndDate } = getTypicalTrafficChartData( {
			dailyTraffic,
		} );

		expect( windowStartDate ).toBe( '2025-08-17' );
		expect( windowEndDate ).toBe( '2026-09-15' );
	} );

	it( 'should return only the columns and no window when there are no rows', () => {
		const { chartData, windowStartDate, windowEndDate } =
			getTypicalTrafficChartData( { dailyTraffic: [] } );

		expect( chartData ).toHaveLength( 1 );
		expect( windowStartDate ).toBeUndefined();
		expect( windowEndDate ).toBeUndefined();
	} );
} );
