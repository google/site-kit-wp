/**
 * Recent activity `aggregateSearchConsoleRows` utility.
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
import sumObjectListValue from '@/js/util/sum-object-list-value';

/**
 * One row of a Search Console report grouped by hour. It is a type and not an
 * interface, so it fits the `Record` that `sumObjectListValue()` takes.
 */
export type SearchConsoleHourRow = {
	/** The hour of the row, e.g. `2026-10-12T17:00:00-07:00`. */
	keys: string[];
	/** The clicks in the hour. */
	clicks: number;
	/** The impressions in the hour. */
	impressions: number;
};

export interface SearchPerformanceTotals {
	/** The clicks in the window. */
	clicks: number;
	/** The impressions in the window. */
	impressions: number;
}

/**
 * Sums the clicks and impressions of a Search Console report grouped by hour,
 * for the hours from the start of the window.
 *
 * The report covers whole days in Pacific Time, so it also has hours from
 * before the window, which this leaves out.
 *
 * @since 1.191.0
 *
 * @param {Array}  rows        The rows of the report, one for each hour, each with `keys`, `clicks` and `impressions`.
 * @param {number} windowStart The start of the window, in milliseconds since the epoch.
 * @return {Object} The `clicks` and `impressions` in the window, which are zero when no row is in the window.
 */
export function aggregateSearchConsoleRows(
	rows: SearchConsoleHourRow[],
	windowStart: number
): SearchPerformanceTotals {
	const rowsInWindow = rows.filter(
		( { keys } ) => Date.parse( keys[ 0 ] ) >= windowStart
	);

	return {
		clicks: sumObjectListValue( rowsInWindow, 'clicks' ),
		impressions: sumObjectListValue( rowsInWindow, 'impressions' ),
	};
}
