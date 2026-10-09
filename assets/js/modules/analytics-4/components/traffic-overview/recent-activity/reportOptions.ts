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
import { getBreakdownReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS } from '@/js/util';

export const TOP_POSTS_REPORT_ID =
	'analytics-4_recent-traffic-breakdown_widget_topPostsArgs';
export const TOP_CHANNELS_REPORT_ID =
	'analytics-4_recent-traffic-breakdown_widget_topChannelsArgs';
export const TOP_REFERRALS_REPORT_ID =
	'analytics-4_recent-traffic-breakdown_widget_topReferralsArgs';

/**
 * The second argument the Recent activity tab passes to `getReport`. A cached
 * report is used for five minutes instead of the default hour, so the tab
 * stays near what is happening on the site.
 */
export const FRESH_DATA_REPORT_FETCH_OPTIONS: ReportFetchOptions = {
	cacheTTL: 5 * MINUTE_IN_SECONDS,
};

/**
 * Builds the options of the report of visitors for each page.
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
	return getBreakdownReportArgs( {
		dimensionName: 'pagePath',
		reportID: TOP_POSTS_REPORT_ID,
		startDate,
		endDate,
	} );
}

/**
 * Builds the options of the report of visitors for each channel.
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
	return getBreakdownReportArgs( {
		dimensionName: 'sessionDefaultChannelGroup',
		reportID: TOP_CHANNELS_REPORT_ID,
		startDate,
		endDate,
	} );
}

/**
 * Builds the options of the report of visitors for each site that referred
 * them.
 *
 * The report keeps only the sessions of the "Referral" channel. Without that
 * filter, it lists a source for every channel, such as `google` for
 * "Organic Search" and `(direct)` for "Direct", which repeats the channels.
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
			reportID: TOP_REFERRALS_REPORT_ID,
			startDate,
			endDate,
		} ),
		dimensionFilters: {
			sessionDefaultChannelGroup: 'Referral',
		},
	};
}
