/**
 * DashboardTopEarningPagesWidgetGA4 reportOptions tests.
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
	TOP_EARNING_PAGES_REPORT_ID,
	getTopEarningPagesReportOptions,
} from './reportOptions';

describe( 'getTopEarningPagesReportOptions', () => {
	it( 'builds the report args with the AdSense account filter, ordering, and limit', () => {
		const args = getTopEarningPagesReportOptions(
			{ startDate: '2025-01-08', endDate: '2025-02-04' },
			{ adSenseAccountID: 'pub-1234567890' }
		);

		expect( args ).toEqual( {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			dimensions: [ 'pagePath', 'adSourceName' ],
			metrics: [ { name: 'totalAdRevenue' } ],
			dimensionFilters: {
				adSourceName: 'Google AdSense account (pub-1234567890)',
			},
			orderby: [
				{ metric: { metricName: 'totalAdRevenue' }, desc: true },
			],
			limit: 5,
			reportID: TOP_EARNING_PAGES_REPORT_ID,
		} );
	} );

	it( 'targets the given AdSense account in the adSourceName filter', () => {
		const args = getTopEarningPagesReportOptions(
			{ startDate: '2025-01-08', endDate: '2025-02-04' },
			{ adSenseAccountID: 'pub-9999999999' }
		);

		expect( args.dimensionFilters ).toEqual( {
			adSourceName: 'Google AdSense account (pub-9999999999)',
		} );
	} );
} );
