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
	/** The days the horizontal axis shows a date label under. */
	ticks: Date[];
	/** Whether any day of the rows has visits. */
	hasVisits: boolean;
}

/**
 * Builds the Typical Traffic chart table from the daily rows.
 *
 * @since n.e.x.t
 *
 * @param {Object}         options              Options.
 * @param {Array.<Object>} options.dailyTraffic The daily rows of the benchmarking response, oldest first.
 * @return {Object} The chart table, the days the axis shows a date label under, and whether any day has visits.
 */
export function getTypicalTrafficChartData( {
	dailyTraffic,
}: TypicalTrafficChartDataOptions ): TypicalTrafficChartData {
	const points = dailyTraffic.map(
		( { date, visits } ): TrafficChartPoint => [
			stringToDate( date ),
			visits,
		]
	);

	return {
		chartData: [
			[
				{ type: 'date', label: __( 'Day', 'google-site-kit' ) },
				// The Typical Traffic tab calls each day's count its visits. Until
				// #13845 moves the daily report from `totalUsers` to `sessions`,
				// the count is visitors.
				{ type: 'number', label: __( 'Visits', 'google-site-kit' ) },
			],
			...points,
		],
		// Google Charts hides the first day's label, so the labels start on the
		// second day, as in `getTrafficChartData()`.
		ticks: points.slice( 1 ).map( ( [ date ] ) => date ),
		hasVisits: dailyTraffic.some( ( { visits } ) => visits > 0 ),
	};
}
