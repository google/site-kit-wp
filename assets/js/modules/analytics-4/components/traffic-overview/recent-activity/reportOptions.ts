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
import {
	INSIGHT_COMPARISON_WEEK_OFFSETS,
	getComparisonDateRange,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { getGraphReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { ExcludedProducts } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS } from '@/js/util';

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

	if ( excludedProducts.by === 'queryVar' ) {
		const { postType, queryVar } = excludedProducts;
		// `get_post_permalink()` puts the slug of a product in the product
		// query var, such as `?product=hoodie`. For a draft, or a post type
		// with no query var, it uses the post type and the ID instead, such as
		// `?post_type=product&p=123`. WordPress sanitizes both names, so they
		// hold no character with a meaning in a regular expression.
		const productParameters = [
			...( queryVar ? [ `${ queryVar }=[^&]` ] : [] ),
			`post_type=${ postType }(&|$)`,
		];

		return {
			pagePathPlusQueryString: {
				filterType: 'stringFilter',
				matchType: 'PARTIAL_REGEXP',
				value: `[?&](${ productParameters.join( '|' ) })`,
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
 * Builds the options of the report of views for each URL on a site with plain
 * permalinks.
 *
 * On plain permalinks, every post has the path of the home URL, and only the
 * query string tells the posts apart. So the report has a row for each path
 * and query string, such as `/?p=123` and `/?p=123&utm_source=newsletter`, and
 * the column adds up the rows of the same post. The report has the 1,000 URLs
 * with the most views, so the URLs of a post with many tracking args, such as
 * `utm_source`, still add up.
 *
 * @since n.e.x.t
 *
 * @param {Object}      dateRange           The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate The first day of the date range.
 * @param {string}      dateRange.endDate   The last day of the date range.
 * @param {Object|null} [excludedProducts]  Optional. The way to recognize the product pages that the report leaves out, or `null` to keep them. Default `null`.
 * @return {Object} The report options.
 */
export function getPlainPermalinkTopPostsReportOptions(
	dateRange: FreshDataDateRange,
	excludedProducts: ExcludedProducts | null = null
): ReportOptions {
	return {
		...getColumnReportOptions(
			dateRange,
			'pagePathPlusQueryString',
			'screenPageViews',
			'analytics-4_recent-traffic-breakdown_widget_topPostsArgs'
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
