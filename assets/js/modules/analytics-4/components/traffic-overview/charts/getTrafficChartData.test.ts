/**
 * Traffic Overview `getTrafficChartData` tests.
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
import { getTrafficChartData } from './getTrafficChartData';
import { createDailyVisitorsReport } from './test-utils';

describe( 'getTrafficChartData', () => {
	it( 'names the two columns the chart shows', () => {
		const { chartData } = getTrafficChartData( {
			report: createDailyVisitorsReport( [ [ '2025-01-13', 5 ] ] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
		] );
	} );

	it( 'shows one day per report row, in the order the report returns them', () => {
		const { chartData } = getTrafficChartData( {
			report: createDailyVisitorsReport( [
				[ '2025-01-13', 40 ],
				[ '2025-01-14', 12 ],
				[ '2025-01-15', 0 ],
				[ '2025-01-16', 7 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 40 ],
			[ new Date( 2025, 0, 14 ), 12 ],
			[ new Date( 2025, 0, 15 ), 0 ],
			[ new Date( 2025, 0, 16 ), 7 ],
		] );
	} );

	it( 'labels every day but the first', () => {
		const { ticks } = getTrafficChartData( {
			report: createDailyVisitorsReport( [
				[ '2025-01-13', 40 ],
				[ '2025-01-14', 12 ],
				[ '2025-01-15', 7 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
		] );
	} );

	it( 'shows the range at zero with a day at each end of the axis when the report is missing', () => {
		const { chartData, ticks, hasVisitors } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 16 ),
		] );
		expect( hasVisitors ).toBe( false );
	} );

	it( 'reports no visitors for a range whose total is zero', () => {
		const { hasVisitors } = getTrafficChartData( {
			report: createDailyVisitorsReport( [
				[ '2025-01-13', 0 ],
				[ '2025-01-14', 0 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );

	it( 'reports visitors for a range whose total is above zero', () => {
		const { hasVisitors } = getTrafficChartData( {
			report: createDailyVisitorsReport( [
				[ '2025-01-13', 0 ],
				[ '2025-01-14', 3 ],
			] ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( true );
	} );

	it( 'reports no visitors for a report that has no total', () => {
		const { hasVisitors } = getTrafficChartData( {
			report: { rows: [] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );
} );
