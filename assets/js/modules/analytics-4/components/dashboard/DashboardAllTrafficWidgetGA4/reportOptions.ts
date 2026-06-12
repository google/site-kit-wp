/**
 * DashboardAllTrafficWidgetGA4 report options.
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

export const TOTALS_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs';
export const GRAPH_REPORT_ID =
	'analytics-4_dashboard-all-traffic-widget-ga4_widget_graphArgs';

const TOTAL_USERS_METRIC: ReportOptions[ 'metrics' ] = [
	{ name: 'totalUsers' },
];

/**
 * Builds the report-options fragment for the All Visitors totals report.
 *
 * Returns only the parts that vary between dashboard and PDF surfaces. The
 * dashboard combines this with start/end dates and entity URL via
 * `useAllTrafficWidgetReport`; the PDF loader combines it inside
 * `getTotalsReportArgs` below.
 *
 * @since 1.181.0
 *
 * @param {Object} [options]                  Options.
 * @param {string} [options.compareStartDate] Comparison start date.
 * @param {string} [options.compareEndDate]   Comparison end date.
 * @param {Object} [options.dimensionFilters] Dimension filters keyed by dimension name.
 * @return {Object} Report-options fragment.
 */
export function getTotalsReportOptions( {
	compareStartDate,
	compareEndDate,
	dimensionFilters,
}: Pick<
	ReportOptions,
	'compareStartDate' | 'compareEndDate' | 'dimensionFilters'
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
	if ( dimensionFilters ) {
		args.dimensionFilters = dimensionFilters;
	}
	return args;
}

/**
 * Builds the report-options fragment for the All Visitors date-dimension graph report.
 *
 * @since 1.181.0
 *
 * @param {Object} [options]                  Options.
 * @param {Object} [options.dimensionFilters] Dimension filters keyed by dimension name.
 * @return {Object} Report-options fragment.
 */
export function getGraphReportOptions( {
	dimensionFilters,
}: Pick< ReportOptions, 'dimensionFilters' > = {} ): Partial< ReportOptions > {
	const args: Partial< ReportOptions > = {
		dimensions: [ 'date' ],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
		reportID: GRAPH_REPORT_ID,
	};
	if ( dimensionFilters ) {
		args.dimensionFilters = dimensionFilters;
	}
	return args;
}

/**
 * Builds the complete GA4 `getReport` args for the All Visitors totals report.
 *
 * Used by the PDF loader, which has the full date range, entity URL, and
 * dimension filters available up-front.
 *
 * @since 1.181.0
 *
 * @param {Object} options                    Options.
 * @param {string} options.startDate          Report start date.
 * @param {string} options.endDate            Report end date.
 * @param {string} options.compareStartDate   Comparison start date.
 * @param {string} options.compareEndDate     Comparison end date.
 * @param {string} [options.url]              Entity URL filter, if any.
 * @param {Object} [options.dimensionFilters] Dimension filters keyed by dimension name.
 * @return {Object} GA4 getReport args.
 */
export function getTotalsReportArgs( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
	dimensionFilters,
}: Pick<
	ReportOptions,
	| 'startDate'
	| 'endDate'
	| 'compareStartDate'
	| 'compareEndDate'
	| 'url'
	| 'dimensionFilters'
> ): ReportOptions {
	const args: ReportOptions = {
		startDate,
		endDate,
		metrics: TOTAL_USERS_METRIC,
		...getTotalsReportOptions( {
			compareStartDate,
			compareEndDate,
			dimensionFilters,
		} ),
	};
	if ( url ) {
		args.url = url;
	}
	return args;
}

/**
 * Builds the complete GA4 `getReport` args for the All Visitors date-dimension graph report.
 *
 * @since 1.181.0
 *
 * @param {Object} options                    Options.
 * @param {string} options.startDate          Report start date.
 * @param {string} options.endDate            Report end date.
 * @param {string} [options.url]              Entity URL filter, if any.
 * @param {Object} [options.dimensionFilters] Dimension filters keyed by dimension name.
 * @return {Object} GA4 getReport args.
 */
export function getGraphReportArgs( {
	startDate,
	endDate,
	url,
	dimensionFilters,
}: Pick<
	ReportOptions,
	'startDate' | 'endDate' | 'url' | 'dimensionFilters'
> ): ReportOptions {
	const args: ReportOptions = {
		startDate,
		endDate,
		metrics: TOTAL_USERS_METRIC,
		...getGraphReportOptions( { dimensionFilters } ),
	};
	if ( url ) {
		args.url = url;
	}
	return args;
}
