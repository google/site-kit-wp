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
import { TOTAL_USERS_METRIC } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { MINUTE_IN_SECONDS } from '@/js/util';
import { getFreshDataWindow } from './utils/getFreshDataWindow';

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

/**
 * The fetch options of the Recent activity tab's reports. A cached report is
 * used for five minutes instead of the default hour, so the tab shows recent
 * traffic.
 */
export const FRESH_DATA_REPORT_FETCH_OPTIONS: ReportFetchOptions = {
	cacheTTL: 5 * MINUTE_IN_SECONDS,
};

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
