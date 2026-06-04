/**
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

const GA4_OVERVIEW_REPORT_ID =
	'search-console_search-funnel-widget-ga4_widget_ga4OverviewArgs';
const GA4_STATS_REPORT_ID =
	'search-console_search-funnel-widget-ga4_widget_ga4StatsArgs';
const GA4_VISITORS_REPORT_ID =
	'search-console_search-funnel-widget-ga4_widget_ga4VisitorsOverviewAndStatsArgs';

// Both GA4 metrics in this widget are filtered to the Organic Search channel,
// matching the dashboard's Search Funnel widget. Returned as fresh objects so
// callers never share (and risk mutating) a single instance across reports.
function organicSearchDimensionFilters() {
	return {
		sessionDefaultChannelGrouping: [ 'Organic Search' ],
	};
}

function dateDimensions() {
	return [ { name: 'date' } ];
}

function dateOrderby() {
	return [ { dimension: { dimensionName: 'date' } } ];
}

interface SearchConsoleReportOptions {
	/** Start date of the combined current + previous range (the comparison start date). */
	compareStartDate: string;
	/** End date of the report. */
	endDate: string;
	/** Entity URL filter, if any. */
	url?: string;
}

interface Analytics4ReportDates {
	startDate: string;
	endDate: string;
	compareStartDate: string;
	compareEndDate: string;
	/** Entity URL filter, if any. */
	url?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Report args are loosely typed plain objects in this codebase. */
type ReportArgs = Record< string, any >;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Builds the Search Console `getReport` args for the impressions/clicks date series.
 *
 * The report spans the current and previous periods (starting at the comparison
 * start date) so it can be partitioned for both the totals and the chart.
 *
 * @since n.e.x.t
 *
 * @param {Object} options                  Options.
 * @param {string} options.compareStartDate Comparison start date (report start).
 * @param {string} options.endDate          Report end date.
 * @param {string} [options.url]            Entity URL filter, if any.
 * @return {Object} Search Console getReport args.
 */
export function getSearchConsoleReportOptions( {
	compareStartDate,
	endDate,
	url,
}: SearchConsoleReportOptions ): ReportArgs {
	const args: ReportArgs = {
		startDate: compareStartDate,
		endDate,
		dimensions: 'date',
	};

	if ( url ) {
		args.url = url;
	}

	return args;
}

/**
 * Builds the GA4 `getReport` args for the Key Events overview (totals) report.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates                  Report dates.
 * @param {string} dates.startDate        Report start date.
 * @param {string} dates.endDate          Report end date.
 * @param {string} dates.compareStartDate Comparison start date.
 * @param {string} dates.compareEndDate   Comparison end date.
 * @param {string} [dates.url]            Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getGA4KeyEventsOverviewReportOptions( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
}: Analytics4ReportDates ): ReportArgs {
	const args: ReportArgs = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics: [ { name: 'keyEvents' }, { name: 'engagementRate' } ],
		dimensionFilters: organicSearchDimensionFilters(),
		reportID: GA4_OVERVIEW_REPORT_ID,
	};

	if ( url ) {
		args.url = url;
	}

	return args;
}

/**
 * Builds the GA4 `getReport` args for the Key Events date series report.
 *
 * Inherits the overview report's metrics and dimension filters, adding the date
 * dimension and ordering used to draw the chart.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates                  Report dates.
 * @param {string} dates.startDate        Report start date.
 * @param {string} dates.endDate          Report end date.
 * @param {string} dates.compareStartDate Comparison start date.
 * @param {string} dates.compareEndDate   Comparison end date.
 * @param {string} [dates.url]            Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getGA4KeyEventsReportOptions( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
}: Analytics4ReportDates ): ReportArgs {
	const args: ReportArgs = {
		...getGA4KeyEventsOverviewReportOptions( {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} ),
		dimensions: dateDimensions(),
		orderby: dateOrderby(),
		reportID: GA4_STATS_REPORT_ID,
	};

	if ( url ) {
		args.url = url;
	}

	return args;
}

/**
 * Builds the GA4 `getReport` args for the Unique Visitors overview + date series report.
 *
 * A single report provides both the totals (via the comparison dates) and the
 * date-dimension series used to draw the chart.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates                  Report dates.
 * @param {string} dates.startDate        Report start date.
 * @param {string} dates.endDate          Report end date.
 * @param {string} dates.compareStartDate Comparison start date.
 * @param {string} dates.compareEndDate   Comparison end date.
 * @param {string} [dates.url]            Entity URL filter, if any.
 * @return {Object} GA4 getReport args.
 */
export function getGA4VisitorsReportOptions( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
}: Analytics4ReportDates ): ReportArgs {
	const args: ReportArgs = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics: [ { name: 'totalUsers' } ],
		dimensions: dateDimensions(),
		dimensionFilters: organicSearchDimensionFilters(),
		orderby: dateOrderby(),
		reportID: GA4_VISITORS_REPORT_ID,
	};

	if ( url ) {
		args.url = url;
	}

	return args;
}
