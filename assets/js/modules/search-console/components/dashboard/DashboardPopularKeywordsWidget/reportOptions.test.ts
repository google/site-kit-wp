/**
 * DashboardPopularKeywordsWidget reportOptions tests.
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
	POPULAR_KEYWORDS_REPORT_ID,
	getPopularKeywordsReportArgs,
	getPopularKeywordsReportOptions,
} from './reportOptions';

describe( 'DashboardPopularKeywordsWidget reportOptions', () => {
	/**
	 * Date range passed to the builders under test.
	 */
	const dates = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
	};

	/**
	 * The exact args the dashboard widget builds for this date range. The shared
	 * builder keeps the dimensions, limit, and report ID the same for the
	 * dashboard and the PDF export.
	 */
	const DASHBOARD_ARGS = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
		dimensions: 'query',
		limit: 10,
		reportID:
			'search-console_dashboard-popular-keywords-widget_widget_reportArgs',
	};

	describe( 'getPopularKeywordsReportOptions', () => {
		it( 'returns the query dimension, limit, and report ID without a date range', () => {
			expect( getPopularKeywordsReportOptions() ).toEqual( {
				dimensions: 'query',
				limit: 10,
				reportID:
					'search-console_dashboard-popular-keywords-widget_widget_reportArgs',
			} );
		} );

		it( 'limits the report to ten rows', () => {
			expect( getPopularKeywordsReportOptions().limit ).toBe( 10 );
		} );

		it( 'leaves out the date range so the caller adds it', () => {
			const options = getPopularKeywordsReportOptions();

			expect( options ).not.toHaveProperty( 'startDate' );
			expect( options ).not.toHaveProperty( 'endDate' );
		} );
	} );

	describe( 'getPopularKeywordsReportArgs', () => {
		it( 'builds the same args the dashboard widget uses', () => {
			expect( getPopularKeywordsReportArgs( dates ) ).toEqual(
				DASHBOARD_ARGS
			);
		} );

		it( 'combines the date range with the shared options', () => {
			expect( getPopularKeywordsReportArgs( dates ) ).toEqual( {
				...dates,
				...getPopularKeywordsReportOptions(),
			} );
		} );
	} );

	it( 'keeps the report ID stable so the dashboard and PDF request the report under one identifier', () => {
		expect( POPULAR_KEYWORDS_REPORT_ID ).toBe(
			'search-console_dashboard-popular-keywords-widget_widget_reportArgs'
		);
	} );
} );
