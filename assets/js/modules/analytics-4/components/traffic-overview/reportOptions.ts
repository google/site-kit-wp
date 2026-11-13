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

export const TOTAL_USERS_METRIC: ReportOptions[ 'metrics' ] = [
	{ name: 'totalUsers' },
];

/**
 * The report-options fragment for the report of visits on each day of the
 * selected range, which the Traffic Overview panel reads on the entity
 * dashboard. A visit is a GA4 session, and the report's totals hold the visits
 * over the whole range.
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
	metrics: [ { name: 'sessions' } ],
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
