/**
 * Typical Traffic Overview date range utilities.
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
import { Select } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getDayCount, getPreviousDate } from '@/js/util';

/** The selected date range, as the typical traffic view reads it. */
export interface TypicalTrafficDateRange {
	/** The first day of the range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the range, as `YYYY-MM-DD`. */
	endDate: string;
	/** The first day of the range of the same length just before it, as `YYYY-MM-DD`. */
	compareStartDate: string;
	/** The last day of the range just before it, as `YYYY-MM-DD`. */
	compareEndDate: string;
	/** The number of days in the range. */
	days: number;
	/** The last day a range can end on, the day before the reference date, as `YYYY-MM-DD`. */
	latestDate: string;
}

/**
 * Gets the last day a date range of the typical traffic view can end on.
 *
 * The reference date, today, still gathers visits, so the view ends its date
 * ranges on the day before it, the last full day, as the PDF export does.
 *
 * @since n.e.x.t
 *
 * @param {string} referenceDate The reference date, as `YYYY-MM-DD`.
 * @return {string} The day before the reference date, as `YYYY-MM-DD`.
 */
export function getTypicalTrafficLatestDate( referenceDate: string ): string {
	return getPreviousDate( referenceDate, 1 );
}

/**
 * Selects the selected date range, as the typical traffic view reads it.
 *
 * The rest of the dashboard ends a range on the reference date, today. The
 * typical traffic view leaves today out, because its visits are still
 * arriving: the chart would dip on its last day, and the totals, the key
 * factors and the insight would count part of a day. So the view resolves
 * the selected range against the day before the reference date. A preset
 * keeps its length and ends a day earlier, and a calendar month or a custom
 * range that reaches today ends the day before.
 *
 * @since n.e.x.t
 *
 * @param {Function} select The data store select function.
 * @return {Object} The range's first and last days, those of the range just before it, the number of its days, and the last day a range can end on.
 */
export function selectTypicalTrafficDateRange(
	select: Select
): TypicalTrafficDateRange {
	const latestDate = getTypicalTrafficLatestDate(
		select( CORE_USER ).getReferenceDate()
	);

	const { startDate, endDate, compareStartDate, compareEndDate } = select(
		CORE_USER
	).getDateRangeDates( { compare: true, referenceDate: latestDate } );

	return {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		days: getDayCount( startDate, endDate ),
		latestDate,
	};
}
