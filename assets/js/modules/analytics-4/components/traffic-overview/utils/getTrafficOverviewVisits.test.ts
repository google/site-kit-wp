/**
 * Traffic Overview `getTrafficOverviewVisits` utility tests.
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
import { getPlaceholderDailyTraffic } from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import { PLACEHOLDER_TOTAL_VISITS } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTotalVisits';
import { createBenchmarkingResponse } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { getTrafficOverviewVisits } from './getTrafficOverviewVisits';

describe( 'getTrafficOverviewVisits', () => {
	const startDate = '2025-01-01';
	const endDate = '2025-01-03';

	const benchmarkingResponse = createBenchmarkingResponse(
		startDate,
		endDate
	);

	// The visits on two of the three days, and the visits over the selected
	// range and the range before it in its totals, selected range first.
	const dailyVisitsReport: Report = {
		rows: [
			{
				dimensionValues: [
					{ value: '20250101' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '12' } ],
			},
			{
				dimensionValues: [
					{ value: '20250103' },
					{ value: 'date_range_0' },
				],
				metricValues: [ { value: '56' } ],
			},
		],
		totals: [
			{ metricValues: [ { value: '68' } ] },
			{ metricValues: [ { value: '50' } ] },
		],
	};

	it( 'should return the placeholder visits when the panel reads no benchmarking response', () => {
		expect(
			getTrafficOverviewVisits( {
				readsBenchmarkingResponse: false,
				benchmarkingFailed: false,
				startDate,
				endDate,
			} )
		).toEqual( {
			dailyTraffic: getPlaceholderDailyTraffic( startDate, endDate ),
			totalVisits: PLACEHOLDER_TOTAL_VISITS,
		} );
	} );

	it( 'should return the visits of the benchmarking response, with the typical range of each day', () => {
		expect(
			getTrafficOverviewVisits( {
				readsBenchmarkingResponse: true,
				benchmarkingResponse,
				benchmarkingFailed: false,
				dailyVisitsReport,
				startDate,
				endDate,
			} )
		).toEqual( {
			dailyTraffic: benchmarkingResponse.dailyTraffic,
			totalVisits: benchmarkingResponse.visits,
		} );
	} );

	it( 'should return no visits while the benchmarking response loads', () => {
		expect(
			getTrafficOverviewVisits( {
				readsBenchmarkingResponse: true,
				benchmarkingFailed: false,
				startDate,
				endDate,
			} )
		).toEqual( { dailyTraffic: undefined, totalVisits: undefined } );
	} );

	it( 'should return the visits of the daily visits report, with no typical range, when the benchmarking request fails', () => {
		expect(
			getTrafficOverviewVisits( {
				readsBenchmarkingResponse: true,
				benchmarkingFailed: true,
				dailyVisitsReport,
				startDate,
				endDate,
			} )
		).toEqual( {
			dailyTraffic: [
				{
					date: '2025-01-01',
					visits: 12,
					expectedMin: null,
					expectedMax: null,
				},
				{
					date: '2025-01-02',
					visits: 0,
					expectedMin: null,
					expectedMax: null,
				},
				{
					date: '2025-01-03',
					visits: 56,
					expectedMin: null,
					expectedMax: null,
				},
			],
			totalVisits: { current: 68, previous: 50 },
		} );
	} );
} );
