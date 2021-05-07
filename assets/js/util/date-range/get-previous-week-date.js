/**
 * `getPreviousWeekDate` utility.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { getPreviousDate } from './get-previous-date';

/**
 * Gets the previous date in the week, relative to the supplied date.
 *
 * Similar to `getPreviousDate` but shifts the resulting date so that it returns a date
 * that falls on the same day of the week as the `relativeDate` while preserving the
 * `daysBefore` as a minimum.
 *
 * @since 1.18.0
 *
 * @param {string} relativeDate Date string (YYYY-MM-DD) to subtract days from.
 * @param {number} daysBefore   Number of days to subtract from relativeDate. Defaults to 0.
 * @return {string}             The date string (YYYY-MM-DD) for the previous date, shifted to fall on the same day of the week.
 */
export const getPreviousWeekDate = ( relativeDate, daysBefore = 0 ) => {
	const remainder = daysBefore % 7;
	const sameDayOfWeek = remainder === 0;

	// already same day of week, do nothing extra
	if ( sameDayOfWeek ) {
		return getPreviousDate( relativeDate, daysBefore );
	}

	const overlap = daysBefore > 7 && remainder < 3;
	const daysRemoved = overlap
		? daysBefore - remainder
		: daysBefore + ( 7 - remainder );

	return getPreviousDate( relativeDate, daysRemoved );
};
