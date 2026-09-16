/**
 * Traffic Overview chart data tests.
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
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { getAnalytics4MockResponse } from '@/js/modules/analytics-4/utils/data-mock';
import { getTrafficChartData } from './getTrafficChartData';

describe( 'getTrafficChartData', () => {
	// `getAnalytics4MockResponse` returns the same numbers for the same options,
	// so the report for `2025-01-13` to `2025-01-16` always has 55, 14, 3, and
	// 13 visitors.
	const reportOptions = getGraphReportArgs( {
		startDate: '2025-01-13',
		endDate: '2025-01-16',
	} );

	it( 'names the columns "Day" and "Users"', () => {
		const { chartData } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData[ 0 ] ).toEqual( [
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'Users' },
		] );
	} );

	it( 'draws one point for each day the report returns', () => {
		const { chartData } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 55 ],
			[ new Date( 2025, 0, 14 ), 14 ],
			[ new Date( 2025, 0, 15 ), 3 ],
			[ new Date( 2025, 0, 16 ), 13 ],
		] );
	} );

	it( 'shows a date label under every day except the first', () => {
		const { ticks } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 15 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( 'draws a flat line at zero across the whole date range when there is no report', () => {
		const { chartData, hasVisitors } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( chartData.slice( 1 ) ).toEqual( [
			[ new Date( 2025, 0, 13 ), 0 ],
			[ new Date( 2025, 0, 14 ), 0 ],
			[ new Date( 2025, 0, 16 ), 0 ],
		] );
		expect( hasVisitors ).toBe( false );
	} );

	it( 'shows a date label on the second day and the last day when there is no report', () => {
		const { ticks } = getTrafficChartData( {
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( ticks ).toEqual( [
			new Date( 2025, 0, 14 ),
			new Date( 2025, 0, 16 ),
		] );
	} );

	it( "finds visitors when the report's total is above zero", () => {
		const { hasVisitors } = getTrafficChartData( {
			report: getAnalytics4MockResponse( reportOptions ),
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( true );
	} );

	it( "finds no visitors when the report's total is '0'", () => {
		const { hasVisitors } = getTrafficChartData( {
			report: { totals: [ { metricValues: [ { value: '0' } ] } ] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );

	it( 'finds no visitors when the report has no total', () => {
		const { hasVisitors } = getTrafficChartData( {
			report: { rows: [] },
			startDate: '2025-01-13',
			endDate: '2025-01-16',
		} );

		expect( hasVisitors ).toBe( false );
	} );
} );
