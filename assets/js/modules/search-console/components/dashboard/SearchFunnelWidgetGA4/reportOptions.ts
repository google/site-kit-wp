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

/**
 * Builds the dimension filters scoping both GA4 metrics in this widget to the
 * Organic Search channel, matching the dashboard's Search Funnel widget.
 *
 * Returned as a fresh object so callers never share (and risk mutating) a
 * single instance across reports.
 *
 * @since n.e.x.t
 *
 * @return {Object} Dimension filters scoped to the Organic Search channel.
 */
function organicSearchDimensionFilters() {
	return {
		sessionDefaultChannelGrouping: [ 'Organic Search' ],
	};
}

/**
 * Search Console report options.
 *
 * @since n.e.x.t
 */
type SearchConsoleReportOptions = {
	startDate: string;
	endDate: string;
	dimensions: string;
	url?: string;
};

/**
 * Analytics 4 report params.
 *
 * @since n.e.x.t
 */
interface Analytics4ReportDates {
	startDate: string;
	endDate: string;
	compareStartDate: string;
	compareEndDate: string;
	/** Entity URL filter, if any. */
	url?: string;
}

/**
 * Analytics 4 report options.
 *
 * @since n.e.x.t
 */
type Analytics4ReportOptions = {
	startDate: string;
	endDate: string;
	compareStartDate?: string;
	compareEndDate?: string;
	metrics: Array< string | { name: string; expression?: string } >;
	dimensions?: Array< string | { name: string } >;
	dimensionFilters?: Record<
		string,
		string | string[] | { filterType?: string; value?: string | string[] }
	>;
	metricFilters?: Record<
		string,
		string | { filterType?: string; value?: string | number }
	>;
	orderby?: Array< {
		metric?: { metricName: string };
		dimension?: { dimensionName: string };
		desc?: boolean;
	} >;
	url?: string;
	limit?: number;
	reportID?: string;
};

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
}: {
	compareStartDate: string;
	endDate: string;
	url?: string;
} ): SearchConsoleReportOptions {
	const args: SearchConsoleReportOptions = {
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
 * @return {Analytics4ReportOptions} GA4 getReport args.
 */
export function getGA4KeyEventsOverviewReportOptions( {
	startDate,
	endDate,
	compareStartDate,
	compareEndDate,
	url,
}: Analytics4ReportDates ): Analytics4ReportOptions {
	const args: Analytics4ReportOptions = {
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
}: Analytics4ReportDates ): Analytics4ReportOptions {
	const args: Analytics4ReportOptions = {
		...getGA4KeyEventsOverviewReportOptions( {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} ),
		dimensions: [ { name: 'date' } ],
		orderby: [ { dimension: { dimensionName: 'date' } } ],
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
}: Analytics4ReportDates ): Analytics4ReportOptions {
	const args: Analytics4ReportOptions = {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ { name: 'date' } ],
		dimensionFilters: organicSearchDimensionFilters(),
		orderby: [ { dimension: { dimensionName: 'date' } } ],
		reportID: GA4_VISITORS_REPORT_ID,
	};

	if ( url ) {
		args.url = url;
	}

	return args;
}
