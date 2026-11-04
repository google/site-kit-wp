/**
 * Recent activity `getFreshDataWindow` utility.
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
import { HOUR_IN_SECONDS } from '@/js/util';

const HOUR_IN_MILLISECONDS = HOUR_IN_SECONDS * 1000;

/** The number of hours the fresh figures of the Recent activity tab count. */
const FRESH_DATA_HOURS = 24;

interface FreshDataWindow {
	/** The day of the first hour, e.g. `2026-10-12`. */
	startDate: string;
	/** The day of the last hour, e.g. `2026-10-13`. */
	endDate: string;
	/** Each hour of the window in the `dateHour` format of Analytics, e.g. `2026101302`, from the oldest. */
	dateHours: string[];
}

/**
 * Gets the start of the last 24 hours, which the fresh figures of the Recent
 * activity tab count.
 *
 * The window starts on a full hour, so it covers the current hour and the 23
 * hours before it, the same hours the reports group their data by.
 *
 * @since 1.191.0
 *
 * @param {number} now The current time, in milliseconds since the epoch.
 * @return {number} The start of the window, in milliseconds since the epoch.
 */
export function getFreshDataWindowStart( now: number ): number {
	const currentHourStart =
		Math.floor( now / HOUR_IN_MILLISECONDS ) * HOUR_IN_MILLISECONDS;

	return currentHourStart - ( FRESH_DATA_HOURS - 1 ) * HOUR_IN_MILLISECONDS;
}

/**
 * Gets the days and hours of the last 24 hours in a time zone.
 *
 * Analytics groups its data by the hours of the property's time zone, and
 * Search Console by the hours of Pacific Time, so the same window has
 * different days and hours in each report.
 *
 * @since 1.191.0
 *
 * @param {number} windowStart The start of the window, from `getFreshDataWindowStart()`.
 * @param {string} timeZone    The time zone, e.g. `America/Los_Angeles`.
 * @return {Object} The first and the last day of the window, and each of its hours.
 */
export function getFreshDataWindow(
	windowStart: number,
	timeZone: string
): FreshDataWindow {
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		hourCycle: 'h23',
	} );

	const hours = Array.from( { length: FRESH_DATA_HOURS }, ( _, index ) => {
		const parts = formatter.formatToParts(
			windowStart + index * HOUR_IN_MILLISECONDS
		);
		const [ year, month, day, hour ] = (
			[ 'year', 'month', 'day', 'hour' ] as const
		 ).map(
			( type ) => parts.find( ( part ) => part.type === type )?.value
		);

		return {
			date: `${ year }-${ month }-${ day }`,
			dateHour: `${ year }${ month }${ day }${ hour }`,
		};
	} );

	return {
		startDate: hours[ 0 ].date,
		endDate: hours[ hours.length - 1 ].date,
		dateHours: hours.map( ( { dateHour } ) => dateHour ),
	};
}
