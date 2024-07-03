/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
import invariant from 'invariant';
import { isString, isDate } from 'lodash';

/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

export const INVALID_DATE_INSTANCE_ERROR =
	'Date param must construct to a valid date instance or be a valid date instance itself.';
export const INVALID_DATE_STRING_ERROR =
	'Invalid dateString parameter, it must be a string.';
export const INVALID_DATE_RANGE_ERROR =
	'Invalid date range, it must be a string with the format "last-x-days".';

export const HOUR_IN_SECONDS = 3600;
export const DAY_IN_SECONDS = 86400;
export const WEEK_IN_SECONDS = 604800;

/**
 * Gets the hash of available date ranges.
 *
 * @since 1.12.0
 *
 * @return {Object} The object hash where every key is a date range slug, and the value is an object with the date range slug and its translation.
 */
export function getAvailableDateRanges() {
	const label = ( days ) =>
		sprintf(
			/* translators: %s: number of days */
			_n( 'Last %s day', 'Last %s days', days, 'google-site-kit' ),
			days
		);

	return {
		'last-7-days': {
			slug: 'last-7-days',
			label: label( 7 ),
			days: 7,
		},
		'last-14-days': {
			slug: 'last-14-days',
			label: label( 14 ),
			days: 14,
		},
		'last-28-days': {
			slug: 'last-28-days',
			label: label( 28 ),
			days: 28,
		},
		'last-90-days': {
			slug: 'last-90-days',
			label: label( 90 ),
			days: 90,
		},
	};
}

/**
 * Gets the current dateRange day count.
 *
 * @since 1.19.0
 * @since 1.26.0 `dateRange` is now a required argument.
 *
 * @param {string} dateRange The date range slug.
 * @return {number} The number of days in the range.
 */
export function getCurrentDateRangeDayCount( dateRange ) {
	const daysMatch = dateRange.match( /last-(\d+)-days/ );

	if ( daysMatch && daysMatch[ 1 ] ) {
		return parseInt( daysMatch[ 1 ], 10 );
	}

	throw new Error( 'Unrecognized date range slug.' );
}

/**
 * Asserts whether a given date string is valid or invalid.
 *
 * @since 1.18.0
 *
 * @param {string} dateString Date string to be asserted against. Defaults to an empty string.
 * @return {boolean}          True if the given date string is valid.
 */
export function isValidDateString( dateString = '' ) {
	if ( ! isString( dateString ) ) {
		return false;
	}

	const dateArray = dateString.split( '-' );
	return dateArray.length === 3 && isDate( new Date( dateString ) );
}

/**
 * Parses the given Date instance and returns a date string (YYYY-MM-DD).
 *
 * @since 1.18.0
 * @since 1.85.0 Updated the function signature to only accept a Date argument.
 *
 * @param {Date} date Date to parse into a string.
 * @return {string}                 The parsed date string (YYYY-MM-DD).
 */
export function getDateString( date ) {
	invariant( isDate( date ), INVALID_DATE_INSTANCE_ERROR );

	const month = `${ date.getMonth() + 1 }`;
	const day = `${ date.getDate() }`;
	const year = date.getFullYear();

	return [
		year,
		month.length < 2 ? `0${ month }` : month,
		day.length < 2 ? `0${ day }` : day,
	].join( '-' );
}

/**
 * Converts a valid date string to a Date instance.
 *
 * @since 1.38.0
 *
 * @param {string} dateString The date string to parse.
 * @return {Date} Date instance.
 */
export function stringToDate( dateString ) {
	invariant( isValidDateString( dateString ), INVALID_DATE_STRING_ERROR );

	/**
	 * Split date into explicit parts rather than pass directly into date constructor
	 * to avoid timezone issues caused by parsing as UTC. Ensures date is accurate for
	 * the user's local time, otherwise has a chance to return a different day than was
	 * passed in depending on timezone.
	 */
	const [ year, month, day ] = dateString.split( '-' );

	return new Date( year, month - 1, day );
}

/**
 * Parses the given date and returns the previous date (daysBefore).
 *
 * @since 1.18.0
 *
 * @param {string} relativeDate Date string (YYYY-MM-DD) to subtract days from.
 * @param {number} daysBefore   Number of days to subtract from relativeDate.
 * @return {string}             The date string (YYYY-MM-DD) for the previous date.
 */
export function getPreviousDate( relativeDate, daysBefore ) {
	return getDateString(
		dateSub( relativeDate, daysBefore * DAY_IN_SECONDS )
	);
}

/**
 * Asserts whether a given dateRange string is valid or invalid.
 *
 * @since 1.18.0
 *
 * @param {string} dateRange Date string to be asserted against. Defaults to an empty string.
 * @return {boolean}          True if the given dateRange string is valid.
 */
export function isValidDateRange( dateRange ) {
	const parts = dateRange.split( '-' );

	return (
		parts.length === 3 &&
		parts[ 0 ] === 'last' &&
		! Number.isNaN( parts[ 1 ] ) &&
		! Number.isNaN( parseFloat( parts[ 1 ] ) ) &&
		parts[ 2 ] === 'days'
	);
}

/**
 * Subtracts duration from the prodived date and returns it.
 *
 * @since n.e.x.t
 *
 * @param {Date|string} relativeDate Date string (YYYY-MM-DD) or date object to subtract duration from.
 * @param {number}      duration     The duration in seconds to subtract from relativeDate.
 * @return {Date} Resulting date.
 */
export function dateSub( relativeDate, duration ) {
	const d = isValidDateString( relativeDate )
		? Date.parse( relativeDate )
		: relativeDate.getTime();
	return new Date( d - duration * 1000 );
}
