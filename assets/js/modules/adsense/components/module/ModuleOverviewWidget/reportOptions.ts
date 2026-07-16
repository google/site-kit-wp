/**
 * Report option builders for the AdSense overview widget.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const CURRENT_RANGE_REPORT_ID =
	'adsense_module-overview-widget_widget_currentRangeArgs';
const PREVIOUS_RANGE_REPORT_ID =
	'adsense_module-overview-widget_widget_previousRangeArgs';
const CURRENT_RANGE_CHART_REPORT_ID =
	'adsense_module-overview-widget_widget_currentRangeChartArgs';
const PREVIOUS_RANGE_CHART_REPORT_ID =
	'adsense_module-overview-widget_widget_previousRangeChartArgs';

/**
 * The widget's four report metrics, in report column order.
 *
 * Each key is the AdSense metric ID sent to `getReport`. Each value is the
 * card label the dashboard and the PDF report show for that metric.
 *
 * @since n.e.x.t
 */
export const MODULE_OVERVIEW_METRICS: Record< string, string > = {
	ESTIMATED_EARNINGS: __( 'Earnings', 'google-site-kit' ),
	PAGE_VIEWS_RPM: __( 'Page RPM', 'google-site-kit' ),
	IMPRESSIONS: __( 'Impressions', 'google-site-kit' ),
	PAGE_VIEWS_CTR: __( 'Page CTR', 'google-site-kit' ),
};

/**
 * The date range the widget's report builders read.
 *
 * @since n.e.x.t
 */
export interface AdSenseReportDates {
	/** First day of the current period (YYYY-MM-DD). */
	startDate: string;
	/** Last day of the current period (YYYY-MM-DD). */
	endDate: string;
	/** First day of the previous period (YYYY-MM-DD). */
	compareStartDate: string;
	/** Last day of the previous period (YYYY-MM-DD). */
	compareEndDate: string;
}

/**
 * Args for one AdSense `getReport` call.
 *
 * @since n.e.x.t
 */
export interface AdSenseReportOptions {
	/** The metric IDs to report on, in column order. */
	metrics: string[];
	/** First day of the report (YYYY-MM-DD). */
	startDate: string;
	/** Last day of the report (YYYY-MM-DD). */
	endDate: string;
	/** The report dimensions, like `[ 'DATE' ]` for a daily series. */
	dimensions?: string[];
	/** ID that keeps this report separate in the datastore cache. */
	reportID: string;
}

/**
 * Builds the AdSense `getReport` args for the current-period totals report.
 *
 * @since n.e.x.t
 *
 * @param dates           Report dates.
 * @param dates.startDate First day of the current period (YYYY-MM-DD).
 * @param dates.endDate   Last day of the current period (YYYY-MM-DD).
 * @return AdSense getReport args.
 */
export function getCurrentRangeArgs( {
	startDate,
	endDate,
}: AdSenseReportDates ): AdSenseReportOptions {
	return {
		metrics: Object.keys( MODULE_OVERVIEW_METRICS ),
		startDate,
		endDate,
		reportID: CURRENT_RANGE_REPORT_ID,
	};
}

/**
 * Builds the AdSense `getReport` args for the previous-period totals report.
 *
 * @since n.e.x.t
 *
 * @param dates                  Report dates.
 * @param dates.compareStartDate First day of the previous period (YYYY-MM-DD).
 * @param dates.compareEndDate   Last day of the previous period (YYYY-MM-DD).
 * @return AdSense getReport args.
 */
export function getPreviousRangeArgs( {
	compareStartDate,
	compareEndDate,
}: AdSenseReportDates ): AdSenseReportOptions {
	return {
		metrics: Object.keys( MODULE_OVERVIEW_METRICS ),
		startDate: compareStartDate,
		endDate: compareEndDate,
		reportID: PREVIOUS_RANGE_REPORT_ID,
	};
}

/**
 * Builds the AdSense `getReport` args for the current-period daily series report.
 *
 * @since n.e.x.t
 *
 * @param dates Report dates.
 * @return AdSense getReport args.
 */
export function getCurrentRangeChartArgs(
	dates: AdSenseReportDates
): AdSenseReportOptions {
	return {
		...getCurrentRangeArgs( dates ),
		dimensions: [ 'DATE' ],
		reportID: CURRENT_RANGE_CHART_REPORT_ID,
	};
}

/**
 * Builds the AdSense `getReport` args for the previous-period daily series report.
 *
 * @since n.e.x.t
 *
 * @param dates Report dates.
 * @return AdSense getReport args.
 */
export function getPreviousRangeChartArgs(
	dates: AdSenseReportDates
): AdSenseReportOptions {
	return {
		...getPreviousRangeArgs( dates ),
		dimensions: [ 'DATE' ],
		reportID: PREVIOUS_RANGE_CHART_REPORT_ID,
	};
}
