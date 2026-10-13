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
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { INSIGHT_COMPARISON_WEEK_OFFSETS } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { TOTAL_USERS_METRIC } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS, addDays } from '@/js/util';

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
 * The report holds the visitors per day from the start of the earliest
 * comparison window to the last day of the date range, so one report covers
 * the date range and every comparison window.
 *
 * @since n.e.x.t
 *
 * @param {Object} dateRange           The Recent activity date range.
 * @param {string} dateRange.startDate The first day of the date range.
 * @param {string} dateRange.endDate   The last day of the date range.
 * @return {Object} GA4 getReport args.
 */
export function getInsightReportArgs( {
	startDate,
	endDate,
}: FreshDataDateRange ): ReportOptions {
	return {
		startDate: addDays(
			startDate,
			Math.max( ...INSIGHT_COMPARISON_WEEK_OFFSETS ) * -7
		),
		endDate,
		metrics: TOTAL_USERS_METRIC,
		dimensions: [ 'date' ],
		orderby: [ { dimension: { dimensionName: 'date' } } ],
		reportID: INSIGHT_REPORT_ID,
	};
}
