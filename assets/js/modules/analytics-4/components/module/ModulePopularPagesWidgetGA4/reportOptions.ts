/**
 * ModulePopularPagesWidgetGA4 report options.
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
 * cached Most popular pages report.
 */
export const POPULAR_PAGES_REPORT_ID =
	'analytics-4_module-popular-pages-widget-ga4_widget_args';

/**
 * Builds the report options the dashboard widget and its PDF export share.
 *
 * Returns the page-path dimension, the four metrics, the pageviews-descending
 * order, the ten-row limit, and the report ID. The caller adds the date range.
 * One builder keeps the two widgets from requesting different reports.
 *
 * @since 1.182.0
 *
 * @return The report options, without the date range.
 */
export function getPopularPagesReportOptions(): Pick<
	ReportOptions,
	'dimensions' | 'metrics' | 'orderby' | 'limit' | 'reportID'
> {
	return {
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
		reportID: POPULAR_PAGES_REPORT_ID,
	};
}

/**
 * Builds the full GA4 `getReport` args for the Most popular pages report.
 *
 * Adds the date range to the shared options, so the PDF loader requests the
 * same report the dashboard widget uses.
 *
 * @since 1.182.0
 *
 * @param dates           Report date range.
 * @param dates.startDate Report start date (YYYY-MM-DD).
 * @param dates.endDate   Report end date (YYYY-MM-DD).
 * @return GA4 getReport args.
 */
export function getPopularPagesReportArgs( {
	startDate,
	endDate,
}: Pick< ReportOptions, 'startDate' | 'endDate' > ): ReportOptions {
	return {
		startDate,
		endDate,
		...getPopularPagesReportOptions(),
	};
}
