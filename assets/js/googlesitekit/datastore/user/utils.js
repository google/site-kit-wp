/**
 * core/user Data store: utils.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

const INVALID_DATE_INSTANCE_ERROR = 'Date param must construct to a valid date instance or be a valid date instance itself.';

/**
 * Asserts whether a given date instance is valid or invalid.
 *
 * @since n.e.x.t
 *
 * @param {Date} date Date instance to be asserted against.
 * @return {boolean}  True if the given date instance is valid.
 */
export const isValidDateInstance = ( date ) => {
	return date instanceof Date && ! isNaN( date );
};

/**
 * Parses the given Date instance and returns a date string (YYYY-MM-DD).
 *
 * @since n.e.x.t
 *
 * @param {string|number|Date} date Date to parse into a string. Must be valid date value to be passed into Date constructor.
 * @return {string}                 The parsed date string (YYYY-MM-DD).
 */
export const getDateString = ( date ) => {
	const dateInsance = new Date( date );
	if ( ! isValidDateInstance( dateInsance ) ) {
		throw new Error( INVALID_DATE_INSTANCE_ERROR );
	}

	const month = `${ dateInsance.getMonth() + 1 }`;
	const day = `${ dateInsance.getDate() }`;
	const year = dateInsance.getFullYear();

	return [
		year,
		month.length < 2 ? `0${ month }` : month,
		day.length < 2 ? `0${ day }` : day,
	].join( '-' );
};

/**
 * Parses the given date and returns the previous date (daysBefore).
 *
 * @since n.e.x.t
 *
 * @param {string} relativeDate Date string (YYYY-MM-DD) to subtract days from.
 * @param {number} daysBefore   Number of days to subtract from relativeDate.
 * @return {string}             The date string (YYYY-MM-DD) for the previous date.
 */
export const getPreviousDate = ( relativeDate = '', daysBefore ) => {
	const dateArray = relativeDate.split( '-' );

	if ( dateArray.length !== 3 || ! isValidDateInstance( new Date( relativeDate ) ) ) {
		throw new Error( INVALID_DATE_INSTANCE_ERROR );
	}

	const [ year, month, day ] = dateArray;
	const date = new Date( year, month - 1, day );

	date.setDate( date.getDate() - daysBefore );

	return getDateString( date );
};

/**
 * Similar to `getPreviousDate` but shifts the resulting date so that it returns a date
 * that falls on the same day of the week as the `relativeDate` while preserving the
 * `daysBefore` as a minimum.
 *
 * @since n.e.x.t
 *
 * @param {string} relativeDate Date string (YYYY-MM-DD) to subtract days from.
 * @param {number} daysBefore   Number of days to subtract from relativeDate.
 * @return {string}             The date string (YYYY-MM-DD) for the previous date, shifted to fall on the same day of the week.
 */
export const getPreviousWeekDate = ( relativeDate, daysBefore ) => {
	const date = new Date( relativeDate );

	if ( ! isValidDateInstance( date ) ) {
		throw new Error( INVALID_DATE_INSTANCE_ERROR );
	}

	const previousDate = new Date( getPreviousDate( relativeDate, daysBefore ) );
	const currentDay = date.getDay();
	const previousDay = previousDate.getDay();
	const sameDayOfWeek = date.getDay() === previousDate.getDay();
	const addedDays = sameDayOfWeek ? 0 : previousDay + ( 7 - currentDay );
	const previousDateDaysBefore = sameDayOfWeek ? 7 : daysBefore + addedDays;

	return getPreviousDate( relativeDate, previousDateDaysBefore );
};
