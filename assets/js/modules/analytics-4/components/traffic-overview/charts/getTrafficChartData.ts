/**
 * Traffic Overview `getTrafficChartData` helper.
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
import { getDateString, stringToDate } from '@/js/util';

export interface TrafficChartColumn {
	/** `date` for the day, `number` for the visitors. */
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
	/**
	 * The daily-visitors report. It has no rows while it resolves, and none
	 * for a range with no traffic.
	 */
	report?: Report;
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
}

export interface TrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TrafficChartTable;
	/** The days the horizontal axis puts a label under. */
	ticks: Date[];
	hasVisitors: boolean;
}

/**
 * Builds a report row for one day with no visitors.
 *
 * @since n.e.x.t
 *
 * @param {string} date The day, as `YYYY-MM-DD`.
 * @return {Object} A report row for that day, with a visitor count of zero.
 */
function createZeroVisitorsRow( date: string ): ReportRow {
	return {
		dimensionValues: [ { value: date.replace( /-/g, '' ) } ],
		metricValues: [ { value: '0' } ],
	};
}

/**
 * Picks the report rows to plot, or builds three rows at zero when the report
 * has none.
 *
 * The three rows are the range's first day, the day after it, and its last day.
 * The first and last put a point at each end of the axis. The middle one takes
 * the first label, because `ticks` skips the first day.
 *
 * @since n.e.x.t
 *
 * @param {Object} options           Options.
 * @param {Object} [options.report]  Optional. The daily-visitors report.
 * @param {string} options.startDate The range's first day.
 * @param {string} options.endDate   The range's last day.
 * @return {Array<Object>} The report rows to plot.
 */
function getRowsToPlot( {
	report,
	startDate,
	endDate,
}: TrafficChartDataOptions ): ReportRow[] {
	if ( report?.rows ) {
		return report.rows;
	}

	const dayAfterStartDate = stringToDate( startDate );
	dayAfterStartDate.setDate( dayAfterStartDate.getDate() + 1 );

	return [
		createZeroVisitorsRow( startDate ),
		createZeroVisitorsRow( getDateString( dayAfterStartDate ) ),
		createZeroVisitorsRow( endDate ),
	];
}

/**
 * Shapes the daily-visitors report into the table the traffic chart reads.
 *
 * @since n.e.x.t
 *
 * @param {Object} options           Options.
 * @param {Object} [options.report]  Optional. The daily-visitors report.
 * @param {string} options.startDate The range's first day.
 * @param {string} options.endDate   The range's last day.
 * @return {Object} The chart table, the days the axis puts a label under, and whether the range has visitors.
 */
export function getTrafficChartData( {
	report,
	startDate,
	endDate,
}: TrafficChartDataOptions ): TrafficChartData {
	const rows = getRowsToPlot( { report, startDate, endDate } );

	const points = rows.reduce< TrafficChartPoint[] >( ( days, row ) => {
		const date = parseDimensionStringToDate(
			row.dimensionValues?.[ 0 ]?.value ?? ''
		);

		if ( date instanceof Date ) {
			days.push( [
				date,
				Number( row.metricValues?.[ 0 ]?.value ) || 0,
			] );
		}

		return days;
	}, [] );

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
		// The first day's label sits against the edge of the chart area, where
		// Google Charts hides it, so the labels start on the second day.
		ticks: points.slice( 1 ).map( ( [ date ] ) => date ),
		hasVisitors: totalUsers > 0,
	};
}
