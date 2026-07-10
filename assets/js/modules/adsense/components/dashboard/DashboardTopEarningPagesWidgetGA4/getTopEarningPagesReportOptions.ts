/**
 * DashboardTopEarningPagesWidgetGA4 report options.
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
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

/**
 * Report ID the dashboard widget and its PDF export share, so both read one
 * cached Top earning pages report.
 */
export const TOP_EARNING_PAGES_REPORT_ID =
	'adsense_top-earning-pages-widget-ga4_widget_args';

/**
 * Extra options the Top earning pages report needs beyond the date range.
 */
export interface TopEarningPagesReportParams {
	/** The AdSense account ID the report's `adSourceName` filter targets. */
	adSenseAccountID: string;
}

/**
 * Builds the GA4 `getReport` args the dashboard widget and its PDF export share.
 *
 * Returns the page-path and ad-source dimensions, the ad revenue metric, the
 * `adSourceName` filter for the linked AdSense account, the revenue-descending
 * order, the five-row limit, and the report ID. One builder keeps the two
 * widgets from requesting different reports.
 *
 * @since n.e.x.t
 *
 * @param dates                   Report date range.
 * @param dates.startDate         Report start date (YYYY-MM-DD).
 * @param dates.endDate           Report end date (YYYY-MM-DD).
 * @param params                  Extra report options.
 * @param params.adSenseAccountID The AdSense account ID the `adSourceName` filter targets.
 * @return GA4 getReport args.
 */
export function getTopEarningPagesReportOptions(
	{ startDate, endDate }: Pick< ReportOptions, 'startDate' | 'endDate' >,
	{ adSenseAccountID }: TopEarningPagesReportParams
): ReportOptions {
	return {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'adSourceName' ],
		metrics: [ { name: 'totalAdRevenue' } ],
		dimensionFilters: {
			adSourceName: `Google AdSense account (${ adSenseAccountID })`,
		},
		orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
		limit: 5,
		reportID: TOP_EARNING_PAGES_REPORT_ID,
	};
}
