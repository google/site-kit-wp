/**
 * Report option builders for the Audience Tiles widget.
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
 * The date range parts every builder needs. The metrics builders also read the
 * comparison range for the delta chip.
 *
 * @since 1.184.0
 */
export type AudienceTilesReportDates = Pick<
	ReportOptions,
	'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
>;

/**
 * The four per-audience metrics, in the order the tile reads them: visitors,
 * visits per visitor, pages per visit, and pageviews.
 *
 * @since 1.184.0
 */
const AUDIENCE_METRICS = [
	{ name: 'totalUsers' },
	{ name: 'sessionsPerUser' },
	{ name: 'screenPageViewsPerSession' },
	{ name: 'screenPageViews' },
];

/**
 * Limits the top content reports to posts, matching the dashboard's
 * `googlesitekit_post_type` filter.
 *
 * @since 1.184.0
 */
const POST_TYPE_DIMENSION_FILTERS = {
	'customEvent:googlesitekit_post_type': {
		filterType: 'stringFilter',
		matchType: 'EXACT',
		value: 'post',
	},
};

/**
 * Builds the main metrics report options, one report split by
 * `audienceResourceName` and filtered to the given audiences.
 *
 * @since 1.184.0
 *
 * @param dates     Report date range, including the comparison range.
 * @param audiences Audience resource names to filter the report to.
 * @return Report options for the main per-audience metrics report.
 */
export function getAudienceTilesMetricsReportOptions(
	dates: AudienceTilesReportDates,
	audiences: string[]
): ReportOptions {
	return {
		...dates,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilters: {
			audienceResourceName: audiences,
		},
		metrics: AUDIENCE_METRICS,
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_reportOptions',
	};
}

/**
 * Builds the Site Kit fallback report options, the same four metrics split by
 * `newVsReturning`.
 *
 * It covers new and returning visitors while they're still gathering data, when
 * the `audienceResourceName` dimension is empty.
 *
 * @since 1.184.0
 *
 * @param dates Report date range, including the comparison range.
 * @return Report options for the `newVsReturning` fallback report.
 */
export function getAudienceTilesSiteKitAudiencesReportOptions(
	dates: AudienceTilesReportDates
): ReportOptions {
	return {
		...dates,
		dimensions: [ { name: 'newVsReturning' } ],
		dimensionFilters: {
			newVsReturning: [ 'new', 'returning' ],
		},
		metrics: AUDIENCE_METRICS,
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_newVsReturningReportOptions',
	};
}

/**
 * Builds the total pageviews report options, one `screenPageViews` total for
 * the whole site, the denominator for each audience's "% of total pageviews".
 *
 * @since 1.184.0
 *
 * @param dates Report date range.
 * @return Report options for the total pageviews report.
 */
export function getAudienceTilesTotalPageviewsReportOptions(
	dates: AudienceTilesReportDates
): ReportOptions {
	const { startDate, endDate } = dates;

	return {
		startDate,
		endDate,
		metrics: [ { name: 'screenPageViews' } ],
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_totalPageviewsReportOptions',
	};
}

/**
 * Builds the top cities report options for cities ranked by `totalUsers`,
 * limited to 4 so the `(not set)` row drops and three cities remain.
 *
 * @since 1.184.0
 *
 * @param dates Report date range.
 * @return Report options for the top cities report.
 */
export function getAudienceTilesTopCitiesReportOptions(
	dates: AudienceTilesReportDates
): ReportOptions {
	const { startDate, endDate } = dates;

	return {
		startDate,
		endDate,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 4,
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_topCitiesReportOptions',
	};
}

/**
 * Builds the top content report options for post pages ranked by
 * `screenPageViews`, filtered to posts by the `googlesitekit_post_type` custom
 * event, limited to three.
 *
 * @since 1.184.0
 *
 * @param dates Report date range.
 * @return Report options for the top content report.
 */
export function getAudienceTilesTopContentReportOptions(
	dates: AudienceTilesReportDates
): ReportOptions {
	const { startDate, endDate } = dates;

	return {
		startDate,
		endDate,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: POST_TYPE_DIMENSION_FILTERS,
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 3,
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_topContentReportOptions',
	};
}

/**
 * Builds the page titles report options.
 *
 * It pairs `pagePath` with `pageTitle` for the post pages, so a path from the
 * top content report resolves to its title. The limit of 15 gives enough rows
 * for the lookup.
 *
 * @since 1.184.0
 *
 * @param dates Report date range.
 * @return Report options for the top content page titles report.
 */
export function getAudienceTilesTopContentPageTitlesReportOptions(
	dates: AudienceTilesReportDates
): ReportOptions {
	const { startDate, endDate } = dates;

	return {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		dimensionFilters: POST_TYPE_DIMENSION_FILTERS,
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 15,
		reportID:
			'audience-segmentation_use-audience-tiles-reports_hook_topContentPageTitlesReportOptions',
	};
}
