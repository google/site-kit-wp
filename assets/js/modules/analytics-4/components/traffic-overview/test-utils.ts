/**
 * Traffic Overview test helpers.
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
import { TYPICAL_TRAFFIC_CHART_DAYS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getDateString, stringToDate } from '@/js/util';

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them.
 *
 * @since 1.188.0
 * @since 1.189.0 Moved to a shared test helper.
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >
): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

/**
 * Gets the class names of the direct children of a tab panel of
 * `TrafficOverviewWidget`, in order.
 *
 * @since n.e.x.t
 *
 * @param {Element} container The element the tab panel rendered into.
 * @return {Array<string>} The class names.
 */
export function getSectionClassNames( container: Element ): string[] {
	return Array.from(
		container.querySelectorAll(
			'.googlesitekit-traffic-overview__panel > *'
		)
	).map( ( section ) => section.className );
}

/**
 * Builds the daily rows of a benchmarking response, one for each day the
 * Typical Traffic chart plots. The last row is the given day.
 *
 * The checked-in `benchmarking-data.json` fixture has only four days.
 *
 * @since n.e.x.t
 *
 * @param {string}   endDate     The last day, as `YYYY-MM-DD`.
 * @param {Function} getVisitors Returns a day's visitors, given the day's position in the rows, from `0`, and the day as `YYYY-MM-DD`.
 * @return {Array.<Object>} The `{ date, visitors }` rows, oldest first.
 */
export function createDailyTrafficRows(
	endDate: string,
	getVisitors: ( dayIndex: number, date: string ) => number
): BenchmarkingDailyTrafficRow[] {
	// The date walks a day at a time, so a daylight-saving change inside the
	// rows doesn't skip or repeat a day.
	const day = stringToDate( endDate );
	day.setDate( day.getDate() - TYPICAL_TRAFFIC_CHART_DAYS + 1 );

	return Array.from(
		{ length: TYPICAL_TRAFFIC_CHART_DAYS },
		( _value, dayIndex ) => {
			const date = getDateString( day );

			day.setDate( day.getDate() + 1 );

			return { date, visitors: getVisitors( dayIndex, date ) };
		}
	);
}

/**
 * Gets an Analytics property's creation time at midday on the given day, as
 * `getPropertyCreateTime()` returns it.
 *
 * Midnight can fall on the day before or the day after in another time zone,
 * so a test or a story that creates the property at midday keeps its day.
 *
 * @since n.e.x.t
 *
 * @param {string} date The day the property was created, as `YYYY-MM-DD`.
 * @return {number} The creation time in milliseconds.
 */
export function getPropertyCreateTimeAtMidday( date: string ): number {
	const day = stringToDate( date );
	day.setHours( 12 );

	return day.getTime();
}
