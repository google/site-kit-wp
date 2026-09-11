/**
 * Headline metric report options builders for Key Metrics tiles.
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
import { HeadlineMetricReportDates } from './types';

/**
 * Builds the Analytics 4 report options for a headline metric's primary event count.
 *
 * Lifted from `OnlineStorePerformanceWidget`'s `getWidgetReportOptions`, this
 * report is goal-type agnostic like the goal driver builders, so the sibling
 * lead-generation Key Metric tiles can reuse it with a lead event.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates             The date range, including the compare dates.
 * @param {string} [primaryEvent]    The primary conversion event name.
 * @param {Object} [breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @return {Object|undefined} The Analytics 4 `getReport` options, or `undefined` when there is no primary event.
 */
export function buildPrimaryEventReportOptions(
	dates: HeadlineMetricReportDates,
	primaryEvent?: string,
	breakdownFilter?: Record< string, unknown >
): ReportOptions | undefined {
	if ( ! primaryEvent ) {
		return undefined;
	}

	return {
		...dates,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'eventName' } ],
		dimensionFilters: {
			eventName: primaryEvent,
			...breakdownFilter,
		} as ReportOptions[ 'dimensionFilters' ],
		reportID: 'analytics-4_goal-driver-reports_primary-event',
	};
}

/**
 * Builds the Analytics 4 report options for a headline metric's engagement rate and sessions.
 *
 * Lifted from `OnlineStorePerformanceWidget`'s `getWidgetReportOptions` and
 * `EngagementRateTile`, which request the same shape.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates             The date range, including the compare dates.
 * @param {Object} [breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @return {Object} The Analytics 4 `getReport` options.
 */
export function buildEngagementReportOptions(
	dates: HeadlineMetricReportDates,
	breakdownFilter?: Record< string, unknown >
): ReportOptions {
	return {
		...dates,
		metrics: [ { name: 'engagementRate' }, { name: 'sessions' } ],
		...( breakdownFilter
			? {
					dimensionFilters:
						breakdownFilter as ReportOptions[ 'dimensionFilters' ],
			  }
			: {} ),
		reportID: 'analytics-4_goal-driver-reports_engagement',
	};
}
