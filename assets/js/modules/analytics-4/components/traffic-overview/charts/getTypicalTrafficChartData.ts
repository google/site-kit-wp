/**
 * Typical Traffic chart data.
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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { stringToDate } from '@/js/util';
import { TrafficChartPoint, TrafficChartTable } from './getTrafficChartData';

export interface TypicalTrafficChartDataOptions {
	/** The daily rows of the benchmarking response, oldest first. */
	dailyTraffic: BenchmarkingDailyTrafficRow[];
}

export interface TypicalTrafficChartData {
	/** The table `GoogleChart` reads as `data`. */
	chartData: TrafficChartTable;
	/** The first day of each month in the window, where the horizontal axis shows a month label. */
	ticks: Date[];
	/** The most visitors on any day of the window. */
	maximumVisitors: number;
	/** The first plotted day, as `YYYY-MM-DD`, or `undefined` when there are no rows. */
	windowStartDate: string | undefined;
	/** The last plotted day, as `YYYY-MM-DD`, or `undefined` when there are no rows. */
	windowEndDate: string | undefined;
}

/**
 * Builds the Typical Traffic chart table from the daily rows.
 *
 * The window runs from the first row to the last, so the length of the
 * selected date range changes nothing here.
 *
 * @since n.e.x.t
 *
 * @param {Object}         options              Options.
 * @param {Array.<Object>} options.dailyTraffic The daily rows of the benchmarking response, oldest first.
 * @return {Object} The chart table, its month ticks, the most visitors on a day, and the window's first and last days.
 */
export function getTypicalTrafficChartData( {
	dailyTraffic,
}: TypicalTrafficChartDataOptions ): TypicalTrafficChartData {
	const points = dailyTraffic.map(
		( { date, visitors } ): TrafficChartPoint => [
			stringToDate( date ),
			visitors,
		]
	);

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				{ type: 'number', label: __( 'Users', 'google-site-kit' ) },
			],
			...points,
		],
		ticks: points
			.filter( ( [ day ] ) => day.getDate() === 1 )
			.map( ( [ day ] ) => day ),
		maximumVisitors: Math.max(
			0,
			...dailyTraffic.map( ( { visitors } ) => visitors )
		),
		windowStartDate: dailyTraffic[ 0 ]?.date,
		windowEndDate: dailyTraffic[ dailyTraffic.length - 1 ]?.date,
	};
}
