/**
 * DashboardPopularKeywordsWidget report options.
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
 * Report ID the dashboard widget and its PDF export share. The shared builder
 * keeps the dimensions, limit, and report ID the same for both, so they request
 * the Top search queries report with one shape. The PDF range still ends a day
 * earlier, because the PDF export excludes the current day.
 */
export const POPULAR_KEYWORDS_REPORT_ID =
	'search-console_dashboard-popular-keywords-widget_widget_reportArgs';

/**
 * Search Console report options shared by the dashboard widget and its PDF export.
 */
export interface PopularKeywordsReportOptions {
	dimensions: string;
	limit: number;
	reportID: string;
}

/**
 * Date range added to the shared report options.
 */
export interface PopularKeywordsReportDates {
	startDate: string;
	endDate: string;
}

/**
 * Builds the report options the dashboard widget and its PDF export share.
 *
 * Returns the query dimension, the limit of 10 rows, and the report ID. The
 * caller adds the date range.
 *
 * @since n.e.x.t
 *
 * @return The report options, without the date range.
 */
export function getPopularKeywordsReportOptions(): PopularKeywordsReportOptions {
	return {
		dimensions: 'query',
		limit: 10,
		reportID: POPULAR_KEYWORDS_REPORT_ID,
	};
}

/**
 * Builds the full Search Console `getReport` args for the Top search queries report.
 *
 * Adds the date range to the shared options, so the PDF loader requests the
 * report with the same dimensions, limit, and report ID the dashboard widget
 * uses.
 *
 * @since n.e.x.t
 *
 * @param dates           Report date range.
 * @param dates.startDate Report start date (YYYY-MM-DD).
 * @param dates.endDate   Report end date (YYYY-MM-DD).
 * @return Search Console getReport args.
 */
export function getPopularKeywordsReportArgs( {
	startDate,
	endDate,
}: PopularKeywordsReportDates ): PopularKeywordsReportDates &
	PopularKeywordsReportOptions {
	return {
		startDate,
		endDate,
		...getPopularKeywordsReportOptions(),
	};
}
