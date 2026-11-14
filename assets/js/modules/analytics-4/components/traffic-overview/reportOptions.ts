/**
 * Traffic Overview report options.
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
import type { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

const TOTALS_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs';
const DAILY_VISITS_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_dailyVisitsArgs';
export const CHANNELS_BREAKDOWN_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_channelsBreakdownArgs';
export const LOCATIONS_BREAKDOWN_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_locationsBreakdownArgs';
export const DEVICES_BREAKDOWN_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_devicesBreakdownArgs';

export const TOTAL_USERS_METRIC: ReportOptions[ 'metrics' ] = [
	{ name: 'totalUsers' },
];

// A visit is a GA4 session.
const SESSIONS_METRIC: ReportOptions[ 'metrics' ] = [ { name: 'sessions' } ];

export interface BreakdownReportDescriptor {
	/** The GA4 dimension that groups the breakdown report's visits, such as `country`. */
	dimensionName: string;
	/** A label that says which part of the plugin asked for the breakdown report. */
	reportID: string;
}

/**
 * The report-options fragment for the report of visits on each day of the
 * selected range. The Traffic Overview panel reads it on the entity dashboard,
 * and its PDF export on every dashboard. A visit is a GA4 session, and the
 * report's totals hold the visits over the whole range.
 *
 * The fragment has no `startDate`, `endDate`, or `url`. `useTrafficReport`
 * adds them.
 *
 * @since n.e.x.t
 */
export const DAILY_VISITS_REPORT_OPTIONS: Pick<
	ReportOptions,
	'metrics' | 'dimensions' | 'reportID'
> = {
	metrics: SESSIONS_METRIC,
	dimensions: [ 'date' ],
	reportID: DAILY_VISITS_REPORT_ID,
};

/**
 * Builds the report-options fragment for the All Visitors totals report.
 *
 * The fragment has no `startDate`, `endDate`, `metrics`, or `url`.
 *
 * @since 1.181.0
 * @since 1.189.0 Removed the `dimensionFilters` option.
 *
 * @param {Object} [options]                  Options.
 * @param {string} [options.compareStartDate] Comparison start date.
 * @param {string} [options.compareEndDate]   Comparison end date.
 * @return {Object} Report-options fragment.
 */
export function getTotalsReportOptions( {
	compareStartDate,
	compareEndDate,
}: Pick<
	ReportOptions,
	'compareStartDate' | 'compareEndDate'
> = {} ): Partial< ReportOptions > {
	const args: Partial< ReportOptions > = {
		reportID: TOTALS_REPORT_ID,
	};
	if ( compareStartDate ) {
		args.compareStartDate = compareStartDate;
	}
	if ( compareEndDate ) {
		args.compareEndDate = compareEndDate;
	}
	return args;
}

/**
 * Builds the report-options fragment for one breakdown dimension of the
 * Traffic Overview panel. The report counts the visits of each value of the
 * dimension over the selected range, most first.
 *
 * The fragment holds no dates, so it stays the same for every date range.
 * `getBreakdownReportArgs` and `useTrafficReport` add the dates and the entity
 * URL.
 *
 * @since 1.188.0
 * @since n.e.x.t Added the `sessions` metric, so the report counts visits.
 *
 * @param {Object} options               Options.
 * @param {string} options.dimensionName GA4 dimension to group the report by.
 * @param {string} options.reportID      Report ID for this breakdown.
 * @return {Object} Report-options fragment.
 */
export function getBreakdownReportOptions( {
	dimensionName,
	reportID,
}: BreakdownReportDescriptor ): Pick<
	ReportOptions,
	'metrics' | 'dimensions' | 'orderby' | 'reportID'
> {
	return {
		metrics: SESSIONS_METRIC,
		dimensions: [ dimensionName ],
		orderby: [
			{
				metric: {
					metricName: 'sessions',
				},
				desc: true,
			},
		],
		reportID,
	};
}

/**
 * Builds the complete GA4 `getReport` args for the All Visitors totals report.
 *
 * @since 1.181.0
 * @since 1.189.0 Removed the `dimensionFilters` option.
 *
 * @param {Object} options                  Options.
 * @param {string} options.startDate        Report start date.
 * @param {string} options.endDate          Report end date.
 * @param {string} options.compareStartDate Comparison start date.
 * @param {string} options.compareEndDate   Comparison end date.
 * @param {string} [options.url]            Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getTotalsReportArgs( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
}: Pick<
	ReportOptions,
	'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate' | 'url'
> ): ReportOptions {
	const args: ReportOptions = {
		startDate,
		endDate,
		metrics: TOTAL_USERS_METRIC,
		...getTotalsReportOptions( {
			compareStartDate,
			compareEndDate,
		} ),
	};
	if ( url ) {
		args.url = url;
	}
	return args;
}

/**
 * Builds the complete GA4 `getReport` args for the report of visits on each
 * day of the selected range. They equal the args `useTrafficReport` builds
 * from `DAILY_VISITS_REPORT_OPTIONS`, so the PDF export reads the report the
 * entity dashboard has loaded.
 *
 * @since n.e.x.t
 *
 * @param {Object} options           Options.
 * @param {string} options.startDate Report start date.
 * @param {string} options.endDate   Report end date.
 * @param {string} [options.url]     Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getDailyVisitsReportArgs( {
	startDate,
	endDate,
	url,
}: Pick< ReportOptions, 'startDate' | 'endDate' | 'url' > ): ReportOptions {
	const args: ReportOptions = {
		startDate,
		endDate,
		...DAILY_VISITS_REPORT_OPTIONS,
	};
	if ( url ) {
		args.url = url;
	}
	return args;
}

/**
 * Builds the complete GA4 `getReport` args for one breakdown dimension of the
 * Traffic Overview panel.
 *
 * @since 1.183.0
 * @since 1.189.0 Removed the `compareStartDate` and `compareEndDate` options.
 * @since n.e.x.t Added the `sessions` metric, so the report counts visits.
 *
 * @param {Object} options               Options.
 * @param {string} options.dimensionName GA4 dimension to break down by.
 * @param {string} options.reportID      Report ID for this breakdown.
 * @param {string} options.startDate     Report start date.
 * @param {string} options.endDate       Report end date.
 * @param {string} [options.url]         Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getBreakdownReportArgs( {
	dimensionName,
	reportID,
	startDate,
	endDate,
	url,
}: BreakdownReportDescriptor &
	Pick< ReportOptions, 'startDate' | 'endDate' | 'url' > ): ReportOptions {
	const args: ReportOptions = {
		startDate,
		endDate,
		...getBreakdownReportOptions( { dimensionName, reportID } ),
	};
	if ( url ) {
		args.url = url;
	}
	return args;
}
