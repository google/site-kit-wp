/**
 * DashboardAllTrafficWidgetGA4 report options tests.
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
import {
	getBreakdownReportArgs,
	getBreakdownReportOptions,
} from './reportOptions';

describe( 'getBreakdownReportOptions', () => {
	it( 'returns the dimension, the ordering by total users, and the report ID it receives', () => {
		expect(
			getBreakdownReportOptions( {
				dimensionName: 'country',
				reportID: 'test-locations-breakdown',
			} )
		).toEqual( {
			dimensions: [ 'country' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: 'test-locations-breakdown',
		} );
	} );
} );

describe( 'getBreakdownReportArgs', () => {
	it( 'returns the dates, the total users metric, the dimension, the ordering, and the report ID', () => {
		expect(
			getBreakdownReportArgs( {
				dimensionName: 'sessionDefaultChannelGrouping',
				reportID: 'test-channels-breakdown',
				startDate: '2025-01-08',
				endDate: '2025-02-04',
				compareStartDate: '2024-12-11',
				compareEndDate: '2025-01-07',
			} )
		).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			compareStartDate: '2024-12-11',
			compareEndDate: '2025-01-07',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'sessionDefaultChannelGrouping' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: 'test-channels-breakdown',
		} );
	} );

	it( 'adds the URL to the args when it receives an entity URL', () => {
		expect(
			getBreakdownReportArgs( {
				dimensionName: 'deviceCategory',
				reportID: 'test-devices-breakdown',
				startDate: '2025-01-08',
				endDate: '2025-02-04',
				compareStartDate: '2024-12-11',
				compareEndDate: '2025-01-07',
				url: 'https://example.com/about/',
			} )
		).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			compareStartDate: '2024-12-11',
			compareEndDate: '2025-01-07',
			metrics: [ { name: 'totalUsers' } ],
			dimensions: [ 'deviceCategory' ],
			orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
			reportID: 'test-devices-breakdown',
			url: 'https://example.com/about/',
		} );
	} );

	it( 'omits the comparison dates and the URL when it receives neither', () => {
		const args = getBreakdownReportArgs( {
			dimensionName: 'deviceCategory',
			reportID: 'test-devices-breakdown',
			startDate: '2025-01-08',
			endDate: '2025-02-04',
		} );

		expect( args ).not.toHaveProperty( 'compareStartDate' );
		expect( args ).not.toHaveProperty( 'compareEndDate' );
		expect( args ).not.toHaveProperty( 'url' );
	} );
} );
