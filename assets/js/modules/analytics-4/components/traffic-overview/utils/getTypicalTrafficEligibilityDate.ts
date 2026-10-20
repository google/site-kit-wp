/**
 * Traffic Overview `getTypicalTrafficEligibilityDate` utility.
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
import { getDateString, stringToDate } from '@/js/util';

/** The months of history a property needs before the Typical Traffic tab appears. */
const TYPICAL_TRAFFIC_MINIMUM_PROPERTY_AGE_MONTHS = 13;

/**
 * Gets the last day an Analytics property can have been created on for the
 * Typical Traffic tab to appear.
 *
 * The day is `TYPICAL_TRAFFIC_MINIMUM_PROPERTY_AGE_MONTHS` calendar months
 * before the reference date. When that month is shorter, the day becomes its
 * last day, so `2026-03-31` gives `2025-02-28` rather than a day in March.
 *
 * @since 1.190.0
 *
 * @param {string} referenceDate The reference date, as `YYYY-MM-DD`.
 * @return {string} The last eligible creation day, as `YYYY-MM-DD`.
 */
export function getTypicalTrafficEligibilityDate(
	referenceDate: string
): string {
	const date = stringToDate( referenceDate );
	const year = date.getFullYear();
	const month = date.getMonth() - TYPICAL_TRAFFIC_MINIMUM_PROPERTY_AGE_MONTHS;

	// Day `0` of the following month is the last day of `month`.
	const lastDayOfMonth = new Date( year, month + 1, 0 ).getDate();

	return getDateString(
		new Date( year, month, Math.min( date.getDate(), lastDayOfMonth ) )
	);
}
