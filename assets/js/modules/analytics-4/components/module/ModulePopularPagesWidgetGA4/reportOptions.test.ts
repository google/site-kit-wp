/**
 * ModulePopularPagesWidgetGA4 reportOptions tests.
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
	POPULAR_PAGES_REPORT_ID,
	getPopularPagesReportArgs,
	getPopularPagesReportOptions,
} from './reportOptions';

describe( 'ModulePopularPagesWidgetGA4 reportOptions', () => {
	/**
	 * Date range passed to the builders under test.
	 */
	const dates = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
	};

	/**
	 * The exact args the dashboard widget builds. The dashboard's report
	 * stays the same only while the shared builder keeps making these args.
	 */
	const DASHBOARD_ARGS = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
		dimensions: [ 'pagePath' ],
		metrics: [
			{ name: 'screenPageViews' },
			{ name: 'sessions' },
			{ name: 'engagementRate' },
			{ name: 'averageSessionDuration' },
		],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: 10,
		reportID: 'analytics-4_module-popular-pages-widget-ga4_widget_args',
	};

	describe( 'getPopularPagesReportOptions', () => {
		it( 'returns the dimension, metrics, ordering, limit, and report ID without a date range', () => {
			expect( getPopularPagesReportOptions() ).toEqual( {
				dimensions: [ 'pagePath' ],
				metrics: [
					{ name: 'screenPageViews' },
					{ name: 'sessions' },
					{ name: 'engagementRate' },
					{ name: 'averageSessionDuration' },
				],
				orderby: [
					{
						metric: { metricName: 'screenPageViews' },
						desc: true,
					},
				],
				limit: 10,
				reportID:
					'analytics-4_module-popular-pages-widget-ga4_widget_args',
			} );
		} );

		it( 'orders by pageviews descending so the top ten pages come first', () => {
			expect( getPopularPagesReportOptions().orderby ).toEqual( [
				{ metric: { metricName: 'screenPageViews' }, desc: true },
			] );
		} );

		it( 'limits the report to ten rows', () => {
			expect( getPopularPagesReportOptions().limit ).toBe( 10 );
		} );

		it( 'leaves out the date range so the caller adds it', () => {
			const options = getPopularPagesReportOptions();

			expect( options ).not.toHaveProperty( 'startDate' );
			expect( options ).not.toHaveProperty( 'endDate' );
		} );
	} );

	describe( 'getPopularPagesReportArgs', () => {
		it( 'builds the same args the dashboard widget uses', () => {
			expect( getPopularPagesReportArgs( dates ) ).toEqual(
				DASHBOARD_ARGS
			);
		} );

		it( 'combines the date range with the shared options', () => {
			expect( getPopularPagesReportArgs( dates ) ).toEqual( {
				...dates,
				...getPopularPagesReportOptions(),
			} );
		} );
	} );

	it( 'keeps the report ID stable so the PDF and dashboard share one cached report', () => {
		expect( POPULAR_PAGES_REPORT_ID ).toBe(
			'analytics-4_module-popular-pages-widget-ga4_widget_args'
		);
	} );
} );
