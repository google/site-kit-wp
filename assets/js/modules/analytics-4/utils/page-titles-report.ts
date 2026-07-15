/**
 * Analytics 4 page titles report helpers.
 *
 * Shared by the `getPageTitles` selector and the PDF export loaders, so the page
 * titles report they request — and the cache key it resolves to — cannot drift.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';

/**
 * How many rows the page titles report requests for each page path.
 *
 * @since n.e.x.t
 */
export const PAGE_TITLES_REQUEST_MULTIPLIER = 5;

/**
 * Report ID (cache key) for the page titles report.
 *
 * @since n.e.x.t
 */
export const PAGE_TITLES_REPORT_ID =
	'analytics-4_get-page-titles_store:selector_options';

/**
 * Collects the unique page paths from a report's rows.
 *
 * The reports this serves dimension `pagePath` first, so each row's first
 * dimension value is its page path.
 *
 * @since n.e.x.t
 *
 * @param [report] Report whose rows carry the page paths.
 * @return Unique page paths in row order.
 */
export function getPagePaths( report?: Report ): string[] {
	const pagePaths: string[] = [];

	( report?.rows ?? [] ).forEach( ( row ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value;
		if ( pagePath && ! pagePaths.includes( pagePath ) ) {
			pagePaths.push( pagePath );
		}
	} );

	return pagePaths;
}

/**
 * Builds the GA4 `getReport` args for the page titles report.
 *
 * @since n.e.x.t
 *
 * @param dates           Report date range.
 * @param dates.startDate Report start date (YYYY-MM-DD).
 * @param dates.endDate   Report end date (YYYY-MM-DD).
 * @param pagePaths       Page paths to resolve titles for.
 * @return GA4 getReport args for the page titles report.
 */
export function getPageTitlesReportOptions(
	{ startDate, endDate }: Pick< ReportOptions, 'startDate' | 'endDate' >,
	pagePaths: string[]
): ReportOptions {
	return {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		dimensionFilters: { pagePath: [ ...pagePaths ].sort() },
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: PAGE_TITLES_REQUEST_MULTIPLIER * pagePaths.length,
		reportID: PAGE_TITLES_REPORT_ID,
	};
}

/**
 * Maps each page path to its title.
 *
 * Keeps the first title found for each path and falls back to `(unknown)` for
 * any path the titles report missed.
 *
 * @since n.e.x.t
 *
 * @param pagePaths      Page paths the titles were requested for.
 * @param [titlesReport] Page titles report.
 * @return Map of page path to page title.
 */
export function getPageTitleMap(
	pagePaths: string[],
	titlesReport?: Report
): Record< string, string > {
	const titles: Record< string, string > = {};

	( titlesReport?.rows ?? [] ).forEach( ( row ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value;
		const pageTitle = row.dimensionValues?.[ 1 ]?.value;
		if ( pagePath && ! titles[ pagePath ] ) {
			titles[ pagePath ] = pageTitle ?? '';
		}
	} );

	pagePaths.forEach( ( pagePath ) => {
		if ( ! titles[ pagePath ] ) {
			titles[ pagePath ] = __( '(unknown)', 'google-site-kit' );
		}
	} );

	return titles;
}
