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
import { getPopularPagesReportOptions } from './reportOptions';

describe( 'getPopularPagesReportOptions', () => {
	const dates = {
		startDate: '2025-01-08',
		endDate: '2025-02-04',
	};

	it( 'returns the same args shape the dashboard widget used before the extraction', () => {
		expect( getPopularPagesReportOptions( dates ) ).toEqual( {
			...dates,
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
		} );
	} );

	it( 'keeps the page-views ordering descending so the top ten pages come first', () => {
		const { orderby } = getPopularPagesReportOptions( dates );

		expect( orderby ).toEqual( [
			{ metric: { metricName: 'screenPageViews' }, desc: true },
		] );
	} );

	it( 'passes through the supplied date range', () => {
		const result = getPopularPagesReportOptions( dates );

		expect( result.startDate ).toBe( dates.startDate );
		expect( result.endDate ).toBe( dates.endDate );
	} );
} );
