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
 * Builds the options of the report of visitors for each page.
 *
 * The report has only the pages with the most visitors, as many as a column
 * shows. Its total still counts every visitor.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The date range of the Recent activity tab.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} The report options.
 */
export function getTopPostsReportOptions( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		...getBreakdownReportArgs( {
			dimensionName: 'pagePath',
			reportID:
				'analytics-4_recent-traffic-breakdown_widget_topPostsArgs',
			startDate,
			endDate,
		} ),
		limit: RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS,
	};
}

/**
 * Builds the options of the report of visitors for each channel.
 *
 * The report has only the channels with the most visitors, as many as a
 * column shows. Its total still counts every visitor.
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
 * sites instead of repeating the channels column. It has only the sites with
 * the most visitors, as many as a column shows. Its total still counts every
 * visitor of the "Referral" channel.
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
