/**
 * ModulePopularPagesWidgetGA4 Latest content report options.
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

export const LATEST_CONTENT_REPORT_ID =
	'analytics-4_module-popular-pages-widget-ga4_latest-content';

/**
 * Builds the GA4 `getReport` args for the Latest content table.
 *
 * @since n.e.x.t
 *
 * @param dates           Report date range.
 * @param dates.startDate Report start date (YYYY-MM-DD).
 * @param dates.endDate   Report end date (YYYY-MM-DD).
 * @param pagePaths       Paths of the posts and products the table lists.
 * @return GA4 getReport args.
 */
export function getLatestContentReportArgs(
	{ startDate, endDate }: Pick< ReportOptions, 'startDate' | 'endDate' >,
	pagePaths: string[]
): ReportOptions {
	return {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [
			{ name: 'screenPageViews' },
			{ name: 'sessions' },
			{ name: 'engagedSessions' },
			{ name: 'averageSessionDuration' },
		],
		dimensionFilters: {
			pagePath: pagePaths,
		},
		limit: pagePaths.length,
		reportID: LATEST_CONTENT_REPORT_ID,
	};
}
