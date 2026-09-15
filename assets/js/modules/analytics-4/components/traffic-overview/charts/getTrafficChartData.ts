/**
 * Traffic Overview chart data.
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

/**
 * Internal dependencies
 */
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import { stringToDate } from '@/js/util';

export interface TrafficChartColumn {
	/** The column type: `date` for the day, `number` for the visitors. */
	type: 'date' | 'number';
	/** The column heading a person sees in a day's tooltip. */
	label: string;
}

export type TrafficChartPoint = [ Date, number ];

export type TrafficChartTable = [
	TrafficChartColumn[],
	...TrafficChartPoint[]
];

export interface TrafficChartDataOptions {
	/** The daily-visitors report, `undefined` until the request has finished. */
	report?: Report;
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
}

export interface TrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TrafficChartTable;
	/** The days the horizontal axis shows a date label under. */
	ticks: Date[];
	/** Whether the range's total is above zero. */
	hasVisitors: boolean;
}

/**
 * Turns the report's rows into the chart's points.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} rows The daily-visitors report rows.
 * @return {Array<Array>} One `[ day, visitors ]` point for each row that has a day.
 */
function getReportPoints( rows: ReportRow[] ): TrafficChartPoint[] {
	return rows.reduce< TrafficChartPoint[] >( ( points, row ) => {
		const date = parseDimensionStringToDate(
			row.dimensionValues?.[ 0 ]?.value ?? ''
		);

		if ( date instanceof Date ) {
			points.push( [
				date,
				parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
			] );
		}

		return points;
	}, [] );
}

/**
 * Builds three points at zero, which draw a flat line along the bottom of the
 * chart.
 *
 * The first and last days put a point at each end of the axis. The second day
 * is there to give the axis a date label, because the labels skip the first
 * day.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array<Array>} The three points, each with no visitors.
 */
function getZeroVisitorPoints(
	startDate: string,
	endDate: string
): TrafficChartPoint[] {
	const secondDay = stringToDate( startDate );
	secondDay.setDate( secondDay.getDate() + 1 );

	return [
		stringToDate( startDate ),
		secondDay,
		stringToDate( endDate ),
	].map( ( date ): TrafficChartPoint => [ date, 0 ] );
}

/**
 * Builds the chart table from the daily-visitors report.
 *
 * @since n.e.x.t
 *
 * @param {Object} options           Options.
 * @param {Object} [options.report]  Optional. The daily-visitors report.
 * @param {string} options.startDate The range's first day.
 * @param {string} options.endDate   The range's last day.
 * @return {Object} The chart table, the days the axis shows a date label under, and whether the range has visitors.
 */
export function getTrafficChartData( {
	report,
	startDate,
	endDate,
}: TrafficChartDataOptions ): TrafficChartData {
	const points = report?.rows?.length
		? getReportPoints( report.rows )
		: getZeroVisitorPoints( startDate, endDate );

	const totalUsers = parseInt(
		report?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? '',
		10
	);

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				{ type: 'number', label: __( 'Users', 'google-site-kit' ) },
			],
			...points,
		],
		// Google Charts hides the first day's label against the edge of the
		// chart area, so the labels start on the second day.
		ticks: points.slice( 1 ).map( ( [ date ] ) => date ),
		hasVisitors: totalUsers > 0,
	};
}
