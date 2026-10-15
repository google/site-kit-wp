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
 * External dependencies
 */
import { escapeRegExp } from 'lodash';

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
 * The metrics of the report of the site's totals, in the order of its
 * `totals` values. The channels and referrals columns count visits, and the
 * posts column counts views.
 */
export const SITE_TOTALS_METRICS = [ 'sessions', 'screenPageViews' ];

/**
 * Builds the options of the report of the site's visits and views over the
 * date range of the Recent activity tab.
 *
 * Each row of the traffic breakdown shows its share of this report's total of
 * the metric that the row counts. A visit has one channel and one source, and
 * a view has one page. So no visit or view counts in two rows of a column.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getSiteTotalsReportOptions( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		startDate,
		endDate,
		metrics: SITE_TOTALS_METRICS.map( ( name ) => ( { name } ) ),
		reportID: 'analytics-4_recent-traffic-breakdown_widget_siteTotalsArgs',
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
 * Builds the filter that leaves the product pages out of the report of views
 * for each page.
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
		// with no query var, it names the post type instead, such as
		// `?post_type=product&p=123`.
		const productParameters = [
			...( queryVar ? [ `${ escapeRegExp( queryVar ) }=[^&]` ] : [] ),
			`post_type=${ escapeRegExp( postType ) }(&|$)`,
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
 * On plain permalinks, the page path of every post is the path of the home
 * URL. So the report has a row for each path and query string, such as
 * `/?p=123`, and sets no `limit`. Analytics then returns up to 10,000 rows, and
 * the column adds up the rows of the same post, such as `/?p=123` and
 * `/?p=123&utm_source=newsletter`. Otherwise, the report has only the pages
 * with the most views, as many as a column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object}      dateRange                 The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate       The first day of the date range.
 * @param {string}      dateRange.endDate         The last day of the date range.
 * @param {Object}      site                      The facts about the site that the report depends on.
 * @param {boolean}     site.usingPlainPermalinks Whether the site uses plain permalinks.
 * @param {Object|null} [site.excludedProducts]   Optional. The way to recognize the product pages that the report leaves out, or `null` to keep them.
 * @return {Object} The report options.
 */
export function getTopPostsReportOptions(
	dateRange: FreshDataDateRange,
	{
		usingPlainPermalinks,
		excludedProducts = null,
	}: {
		usingPlainPermalinks: boolean;
		excludedProducts?: ExcludedProducts | null;
	}
): ReportOptions {
	const reportOptions = getColumnReportOptions(
		dateRange,
		usingPlainPermalinks ? 'pagePathPlusQueryString' : 'pagePath',
		'screenPageViews',
		'analytics-4_recent-traffic-breakdown_widget_topPostsArgs'
	);

	return {
		...reportOptions,
		...( excludedProducts
			? {
					dimensionFilters:
						getExcludedProductsFilters( excludedProducts ),
			  }
			: {} ),
		...( usingPlainPermalinks
			? {}
			: { limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } ),
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
