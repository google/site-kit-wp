/**
 * Recent activity report options.
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
import { ReportFetchOptions } from '@/js/googlesitekit/data/create-get-report-resolver';
import { RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { getFreshDataWindow } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getFreshDataWindow';
import {
	INSIGHT_COMPARISON_WEEK_OFFSETS,
	getComparisonDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import {
	TOTAL_USERS_METRIC,
	getGraphReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { ExcludedProducts } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS } from '@/js/util';

interface SearchPerformanceReportOptions {
	/** The day of the first hour of the window, in Pacific Time. */
	startDate: string;
	/** The day of the last hour of the window, in Pacific Time. */
	endDate: string;
	/** The `hour` dimension. */
	dimensions: 'hour';
	/** A label that says which part of the plugin asked for the report. */
	reportID: string;
}

export const INSIGHT_REPORT_ID =
	'analytics-4_traffic-overview_recent-activity_insightArgs';

/**
 * The fetch options of the Recent activity reports. A five-minute cache keeps
 * the figures fresh.
 */
export const FRESH_DATA_FETCH_OPTIONS: ReportFetchOptions = {
	cacheTTL: 5 * MINUTE_IN_SECONDS,
};

/**
 * Builds the GA4 `getReport` args for the insight notice's report.
 *
 * The report holds the visitors per day, like the traffic chart's report,
 * from the start of the earliest comparison window to the last day of the date
 * range, which covers the date range and every comparison window.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The Recent activity date range.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} GA4 getReport args.
 */
export function getInsightReportArgs(
	dateRange: FreshDataDateRange
): ReportOptions {
	const earliestComparison = getComparisonDateRange(
		dateRange,
		Math.max( ...INSIGHT_COMPARISON_WEEK_OFFSETS )
	);

	return {
		...getGraphReportArgs( {
			startDate: earliestComparison.startDate,
			endDate: dateRange.endDate,
		} ),
		reportID: INSIGHT_REPORT_ID,
	};
}

/**
 * Builds the options of the report that gives the time zone of the Analytics
 * property, in its `metadata`.
 *
 * The Total visitors report filters by the hours of the property's time zone,
 * which a user who doesn't own the Analytics module can't read from the
 * property itself. Any report has the time zone, so this one asks for the
 * days of the window in UTC, before the time zone is known.
 *
 * @since n.e.x.t
 *
 * @param {number} windowStart The start of the window, from `getFreshDataWindowStart()`.
 * @return {Object} The report options.
 */
export function getTimeZoneReportOptions( windowStart: number ): ReportOptions {
	const { startDate, endDate } = getFreshDataWindow( windowStart, 'UTC' );

	return {
		startDate,
		endDate,
		metrics: TOTAL_USERS_METRIC,
		reportID: 'analytics-4_fresh-metrics-row_widget_timeZoneArgs',
	};
}

/**
 * Builds the options of the report of visitors in the last 24 hours.
 *
 * `dateHour` is a filter and not a dimension, so the report has one row that
 * counts each visitor once. A row for each hour would count a visitor once in
 * every hour they visited.
 *
 * @since n.e.x.t
 *
 * @param {number} windowStart The start of the window, from `getFreshDataWindowStart()`.
 * @param {string} timeZone    The time zone of the Analytics property.
 * @return {Object} The report options.
 */
export function getTotalVisitorsReportOptions(
	windowStart: number,
	timeZone: string
): ReportOptions {
	const { startDate, endDate, dateHours } = getFreshDataWindow(
		windowStart,
		timeZone
	);

	return {
		startDate,
		endDate,
		metrics: TOTAL_USERS_METRIC,
		dimensionFilters: {
			dateHour: dateHours,
		},
		reportID: 'analytics-4_fresh-metrics-row_widget_totalVisitorsArgs',
	};
}

/**
 * Builds the options of the Search Console report of clicks and impressions
 * for each hour of the last 24 hours.
 *
 * A report grouped by hour includes the latest hours, because Site Kit then
 * asks Search Console for its `hourly_all` data state. Search Console dates
 * are in Pacific Time.
 *
 * @since n.e.x.t
 *
 * @param {number} windowStart The start of the window, from `getFreshDataWindowStart()`.
 * @return {Object} The report options.
 */
export function getSearchPerformanceReportOptions(
	windowStart: number
): SearchPerformanceReportOptions {
	const { startDate, endDate } = getFreshDataWindow(
		windowStart,
		'America/Los_Angeles'
	);

	return {
		startDate,
		endDate,
		dimensions: 'hour',
		reportID:
			'search-console_fresh-metrics-row_widget_searchPerformanceArgs',
	};
}

/**
 * Builds the options of a column's report, which counts a metric for each
 * value of a dimension, most first.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @param {string} dimension           The dimension, such as `sessionSource`.
 * @param {string} metric              The metric, `sessions` or `screenPageViews`.
 * @param {string} reportID            The ID of the report.
 * @return {Object} The report options.
 */
function getColumnReportOptions(
	{ startDate, endDate }: FreshDataDateRange,
	dimension: string,
	metric: string,
	reportID: string
): ReportOptions {
	return {
		startDate,
		endDate,
		dimensions: [ dimension ],
		metrics: [ { name: metric } ],
		orderby: [ { metric: { metricName: metric }, desc: true } ],
		reportID,
	};
}

/**
 * Builds the pattern that matches the query string of a single product's URL
 * on plain permalinks.
 *
 * It matches the product's slug in its query var, such as `/?product=hoodie`,
 * and the product post type with the product's ID in either order, such as
 * `/?post_type=product&p=5`. It doesn't match the shop or a product search,
 * which send `post_type=product` with no ID. Analytics reads the pattern as
 * RE2, which has no lookaround and no backreference.
 *
 * @since n.e.x.t
 *
 * @param {string}      postType The product post type, such as `product`.
 * @param {string|null} queryVar The query var of the product post type, such as `product`, or `null` where it has none.
 * @return {string} The pattern.
 */
function getProductQueryStringPattern(
	postType: string,
	queryVar: string | null
): string {
	// WordPress keeps a post type and its query var to lowercase letters,
	// digits, `-` and `_`, so neither needs escaping in the pattern.
	const alternatives = [
		`post_type=${ postType }&(?:[^&]*&)*p=[0-9]`,
		`p=[0-9]+&(?:[^&]*&)*post_type=${ postType }(?:&|$)`,
	];

	if ( queryVar ) {
		alternatives.unshift( `${ queryVar }=[^&]` );
	}

	return `[?&](?:${ alternatives.join( '|' ) })`;
}

/**
 * Builds the filter that removes the product pages from the report of views for
 * each page.
 *
 * @since n.e.x.t
 *
 * @param {Object} excludedProducts The way to recognize a product page.
 * @return {Object} The dimension filters.
 */
function getExcludedProductsFilters(
	excludedProducts: ExcludedProducts
): ReportOptions[ 'dimensionFilters' ] {
	if ( excludedProducts.by === 'pathPrefix' ) {
		return {
			pagePath: {
				filterType: 'stringFilter',
				matchType: 'BEGINS_WITH',
				value: excludedProducts.pathPrefix,
				notExpression: true,
			},
		};
	}

	if ( excludedProducts.by === 'queryString' ) {
		return {
			pagePathPlusQueryString: {
				filterType: 'stringFilter',
				matchType: 'PARTIAL_REGEXP',
				value: getProductQueryStringPattern(
					excludedProducts.postType,
					excludedProducts.queryVar
				),
				notExpression: true,
			},
		};
	}

	return {
		'customEvent:googlesitekit_post_type': {
			filterType: 'stringFilter',
			matchType: 'EXACT',
			value: excludedProducts.postType,
			notExpression: true,
		},
	};
}

/**
 * Builds the options of the report of views for each page.
 *
 * The report has only the pages with the most views, as many as a column
 * shows.
 *
 * @since n.e.x.t
 *
 * @param {Object}      dateRange           The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate The first day of the date range.
 * @param {string}      dateRange.endDate   The last day of the date range.
 * @param {Object|null} [excludedProducts]  Optional. The way to recognize the product pages that the report leaves out, or `null` to keep them. Default `null`.
 * @return {Object} The report options.
 */
export function getTopPostsReportOptions(
	dateRange: FreshDataDateRange,
	excludedProducts: ExcludedProducts | null = null
): ReportOptions {
	return {
		...getColumnReportOptions(
			dateRange,
			'pagePath',
			'screenPageViews',
			'analytics-4_recent-traffic-breakdown_widget_topPostsArgs'
		),
		...( excludedProducts
			? {
					dimensionFilters:
						getExcludedProductsFilters( excludedProducts ),
			  }
			: {} ),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}

/**
 * Builds the options of the report of views for each URL on plain permalinks,
 * where every post shares the path of the home page.
 *
 * The report reads each URL with its query string, such as `/?p=123`. Many
 * URLs can show one post, such as `/?p=123&utm_source=newsletter`, so the
 * report has the 1,000 URLs with the most views rather than as many as a
 * column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object}      dateRange           The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate The first day of the date range.
 * @param {string}      dateRange.endDate   The last day of the date range.
 * @param {Object|null} excludedProducts    The way to recognize the product URLs that the report leaves out, or `null` to keep them.
 * @return {Object} The report options.
 */
export function getPlainPermalinkTopPostsReportOptions(
	dateRange: FreshDataDateRange,
	excludedProducts: ExcludedProducts | null
): ReportOptions {
	return {
		...getColumnReportOptions(
			dateRange,
			'pagePathPlusQueryString',
			'screenPageViews',
			'analytics-4_recent-traffic-breakdown_widget_plainPermalinkTopPostsArgs'
		),
		...( excludedProducts
			? {
					dimensionFilters:
						getExcludedProductsFilters( excludedProducts ),
			  }
			: {} ),
		limit: 1000,
	};
}

/**
 * Builds the options of the report of visits for each channel.
 *
 * The report has only the channels with the most visits, as many as a column
 * shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getTopChannelsReportOptions(
	dateRange: FreshDataDateRange
): ReportOptions {
	return {
		...getColumnReportOptions(
			dateRange,
			'sessionDefaultChannelGroup',
			'sessions',
			'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs'
		),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}

/**
 * Builds the options of the report of visits for each site that referred
 * them.
 *
 * The report counts only the "Referral" channel, so the column lists referring
 * sites instead of repeating the channels column. The report has only the
 * sites with the most visits, as many as a column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getTopReferralsReportOptions(
	dateRange: FreshDataDateRange
): ReportOptions {
	return {
		...getColumnReportOptions(
			dateRange,
			'sessionSource',
			'sessions',
			'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs'
		),
		dimensionFilters: {
			sessionDefaultChannelGroup: 'Referral',
		},
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}
