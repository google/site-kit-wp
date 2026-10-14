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
import {
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
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
 * Builds the options of the report of the site's visitors over the date range
 * of the Recent activity tab.
 *
 * Each row of the traffic breakdown shows its share of this report's total,
 * which counts each visitor once.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getSiteVisitorsReportOptions( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		...getTotalsReportArgs( { startDate, endDate } ),
		reportID:
			'analytics-4_recent-traffic-breakdown_widget_siteVisitorsArgs',
	};
}

/**
 * Builds the options of the report of visitors for each page.
 *
 * The report has only the pages with the most visitors, as many as a column
 * shows. With `excludedPathPrefix`, the report omits the pages whose path
 * starts with that prefix, such as the products under `/product/`.
 *
 * @since n.e.x.t
 *
 * @param {Object}      dateRange            The date range of the Recent activity tab.
 * @param {string}      dateRange.startDate  The first day of the date range.
 * @param {string}      dateRange.endDate    The last day of the date range.
 * @param {string|null} [excludedPathPrefix] Optional. The start of the paths of the pages to omit, such as `/product/`.
 * @return {Object} The report options.
 */
export function getTopPostsReportOptions(
	{ startDate, endDate }: FreshDataDateRange,
	excludedPathPrefix?: string | null
): ReportOptions {
	return {
		...getBreakdownReportArgs( {
			dimensionName: 'pagePath',
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
			startDate,
			endDate,
		} ),
		...( excludedPathPrefix
			? {
					dimensionFilters: {
						pagePath: {
							filterType: 'stringFilter',
							matchType: 'BEGINS_WITH',
							value: excludedPathPrefix,
							notExpression: true,
						},
					},
			  }
			: {} ),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}

/**
 * Builds the options of the report of visitors for each channel.
 *
 * The report has only the channels with the most visitors, as many as a
 * column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getTopChannelsReportOptions( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		...getBreakdownReportArgs( {
			dimensionName: 'sessionDefaultChannelGroup',
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs',
			startDate,
			endDate,
		} ),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}

/**
 * Builds the options of the report of visitors for each site that referred
 * them.
 *
 * The report counts only the "Referral" channel, so the column lists referring
 * sites instead of repeating the channels column. The report has only the
 * sites with the most visitors, as many as a column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getTopReferralsReportOptions( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		...getBreakdownReportArgs( {
			dimensionName: 'sessionSource',
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs',
			startDate,
			endDate,
		} ),
		dimensionFilters: {
			sessionDefaultChannelGroup: 'Referral',
		},
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}
