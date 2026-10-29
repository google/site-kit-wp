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
 * @since 1.191.0
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
 * @since 1.191.0
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
 * @since 1.191.0
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
 * @since 1.191.0
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
 * Builds the options of a column's report, which counts the visitors for each
 * value of a dimension, most first.
 *
 * The report has only the values with the most visitors, as many as a column
 * shows.
 *
 * @since 1.191.0
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @param {string} dimension           The dimension, such as `sessionSource`.
 * @param {string} reportID            The ID of the report.
 * @param {Object} dimensionFilters    The dimension filters, or an empty object for none.
 * @return {Object} The report options.
 */
function getColumnReportOptions(
	{ startDate, endDate }: FreshDataDateRange,
	dimension: string,
	reportID: string,
	dimensionFilters: NonNullable< ReportOptions[ 'dimensionFilters' ] >
): ReportOptions {
	return {
		startDate,
		endDate,
		dimensions: [ dimension ],
		metrics: TOTAL_USERS_METRIC,
		orderby: [ { metric: { metricName: 'totalUsers' }, desc: true } ],
		...( Object.keys( dimensionFilters ).length
			? { dimensionFilters }
			: {} ),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
		reportID,
	};
}

/**
 * Builds the filter that leaves the product pages out of a column's report.
 *
 * @since 1.191.0
 *
 * @param {Object|null} excludedProducts The way to recognize a product page, or `null` to keep the product pages.
 * @return {Object} The dimension filters, or an empty object for none.
 */
function getExcludedProductsFilters(
	excludedProducts: ExcludedProducts | null
): NonNullable< ReportOptions[ 'dimensionFilters' ] > {
	if ( ! excludedProducts ) {
		return {};
	}

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
 * Builds the options of the report of visitors for each page.
 *
 * @since 1.191.0
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
	return getColumnReportOptions(
		dateRange,
		'pagePath',
		'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
		getExcludedProductsFilters( excludedProducts )
	);
}

/**
 * Builds the options of the report of visitors for each channel.
 *
 * Its total counts each visitor once, so every column's shares are a
 * percentage of it. With products left out, it leaves out the visitors who
 * saw only product pages.
 *
 * @since 1.191.0
 *
 * @param {Object}      dateRange           The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate The first day of the date range.
 * @param {string}      dateRange.endDate   The last day of the date range.
 * @param {Object|null} [excludedProducts]  Optional. The way to recognize the product pages that the report leaves out, or `null` to keep them. Default `null`.
 * @return {Object} The report options.
 */
export function getTopChannelsReportOptions(
	dateRange: FreshDataDateRange,
	excludedProducts: ExcludedProducts | null = null
): ReportOptions {
	return getColumnReportOptions(
		dateRange,
		'sessionDefaultChannelGroup',
		'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs',
		getExcludedProductsFilters( excludedProducts )
	);
}

/**
 * Builds the options of the report of visitors for each site that referred
 * them.
 *
 * The report counts only the "Referral" channel, so the column lists referring
 * sites instead of repeating the channels column.
 *
 * @since 1.191.0
 *
 * @param {Object}      dateRange           The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate The first day of the date range.
 * @param {string}      dateRange.endDate   The last day of the date range.
 * @param {Object|null} [excludedProducts]  Optional. The way to recognize the product pages that the report leaves out, or `null` to keep them. Default `null`.
 * @return {Object} The report options.
 */
export function getTopReferralsReportOptions(
	dateRange: FreshDataDateRange,
	excludedProducts: ExcludedProducts | null = null
): ReportOptions {
	return getColumnReportOptions(
		dateRange,
		'sessionSource',
		'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs',
		{
			sessionDefaultChannelGroup: 'Referral',
			...getExcludedProductsFilters( excludedProducts ),
		}
	);
}
