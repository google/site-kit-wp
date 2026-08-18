/**
 * Analytics 4 page report URL helper.
 *
 * Shared by the PDF export loaders that link a page title to its All pages and
 * screens report.
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
 * The Analytics 4 selectors this helper reads.
 */
interface ReportURLSelect {
	/** Returns the URL of an Analytics report for a report type and arguments. */
	getServiceReportURL: (
		reportType: string,
		args: {
			filters: Record< string, string >;
			dates: { startDate: string; endDate: string };
		}
	) => string | undefined;
}

/**
 * Builds the All pages and screens report URL a page title links to.
 *
 * @since n.e.x.t
 *
 * @param {ReportURLSelect} analytics       The Analytics 4 store's selectors.
 * @param {string}          pagePath        The page path to filter the report to.
 * @param {Object}          dates           The report's date range.
 * @param {string}          dates.startDate The first day of the range (YYYY-MM-DD).
 * @param {string}          dates.endDate   The last day of the range (YYYY-MM-DD).
 * @return {string|undefined} The report URL, or `undefined` before the Analytics property loads.
 */
export function getAllPagesReportURL(
	analytics: ReportURLSelect,
	pagePath: string,
	dates: { startDate: string; endDate: string }
): string | undefined {
	return analytics.getServiceReportURL( 'all-pages-and-screens', {
		filters: { unifiedPagePathScreen: pagePath },
		dates,
	} );
}

/**
 * Builds the All pages and screens report URL a page title links to, or
 * `undefined` on a view-only export, where a loader leaves out the links an
 * administrator sees.
 *
 * @since n.e.x.t
 *
 * @param {Object}          params                 Link parameters.
 * @param {ReportURLSelect} params.analytics       The Analytics 4 store's selectors.
 * @param {string}          params.pagePath        The page path to filter the report to.
 * @param {Object}          params.dates           The report's date range.
 * @param {string}          params.dates.startDate The first day of the range (YYYY-MM-DD).
 * @param {string}          params.dates.endDate   The last day of the range (YYYY-MM-DD).
 * @param {boolean}         params.viewOnly        Whether the export runs on a view-only dashboard.
 * @return {string|undefined} The report URL, or `undefined` when unlinked or before the Analytics property loads.
 */
export function getPageReportURL( {
	analytics,
	pagePath,
	dates,
	viewOnly,
}: {
	analytics: ReportURLSelect;
	pagePath: string;
	dates: { startDate: string; endDate: string };
	viewOnly: boolean;
} ): string | undefined {
	return viewOnly
		? undefined
		: getAllPagesReportURL( analytics, pagePath, dates );
}
