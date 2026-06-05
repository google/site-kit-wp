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

export const POPULAR_PAGES_REPORT_ID =
	'analytics-4_module-popular-pages-widget-ga4_widget_args';

/**
 * Builds the GA4 `getReport` args for the Most popular pages report.
 *
 * The dashboard widget and the PDF data loader both call this so they request
 * the same report: the top ten pages by pageviews, with pageviews, sessions,
 * engagement rate, and average session duration. Keeping one builder stops the
 * two surfaces from drifting apart.
 *
 * @since n.e.x.t
 *
 * @param dates           Report date range from `getDateRangeDates()`.
 * @param dates.startDate Report start date.
 * @param dates.endDate   Report end date.
 * @return GA4 getReport args.
 */
export function getPopularPagesReportOptions(
	dates: Pick< ReportOptions, 'startDate' | 'endDate' >
): ReportOptions {
	return {
		...dates,
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
			{
				name: 'sessions',
			},
			{
				name: 'engagementRate',
			},
			{
				name: 'averageSessionDuration',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 10,
		reportID: POPULAR_PAGES_REPORT_ID,
	};
}
