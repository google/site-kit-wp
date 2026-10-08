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
import { isDate, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getLocale } from './i18n';

export const INVALID_DATE_INSTANCE_ERROR =
	'Date param must construct to a valid date instance or be a valid date instance itself.';
export const INVALID_DATE_STRING_ERROR =
	'Invalid dateString parameter, it must be a string.';
export const INVALID_DATE_RANGE_ERROR =
	'Invalid date range, it must be a string with the format "last-x-days".';

export const MINUTE_IN_SECONDS = 60;
export const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
export const WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS;
export const MONTH_IN_SECONDS = 30 * DAY_IN_SECONDS;

export const DATE_PICKER_LOOKBACK_MONTHS = 14;

interface DateRangeOption {
	slug: string;
	label: string;
	days: number;
}

export type DateRangeSelection =
	| { type: 'preset'; slug: string }
	| { type: 'calendarMonth'; month: string }
	| { type: 'custom'; startDate: string; endDate: string };

interface ResolvedDateRange {
	startDate: string;
	endDate: string;
}

/**
 * Gets the hash of available date ranges.
 *
 * @since 1.12.0
 *
 * @return {Object} The object hash where every key is a date range slug, and the value is an object with the date range slug and its translation.
 */
export function getAvailableDateRanges(): Record< string, DateRangeOption > {
	function label( days: number ): string {
		return sprintf(
			/* translators: %s: number of days */
			_n( 'Last %s day', 'Last %s days', days, 'google-site-kit' ),
			String( days )
		);
	}

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
export function getCurrentDateRangeDayCount( dateRange: string ): number {
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
export function isValidDateString(
	dateString: unknown = ''
): dateString is string {
	if ( ! isString( dateString ) ) {
		return false;
	}

	const dateArray = dateString.split( '-' );
	if ( dateArray.length !== 3 ) {
		return false;
	}

	// Valid use of `new Date()`, constructing a new date from the string.
	// eslint-disable-next-line sitekit/no-direct-date
	const date = new Date( dateString );

	return isDate( date ) && ! isNaN( Number( date ) );
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
export function getDateString( date?: unknown ): string {
	invariant(
		isDate( date ) && ! isNaN( Number( date ) ),
		INVALID_DATE_INSTANCE_ERROR
	);

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
export function stringToDate( dateString: unknown ): Date {
	invariant( isValidDateString( dateString ), INVALID_DATE_STRING_ERROR );

	/**
	 * Split date into explicit parts rather than pass directly into date constructor
	 * to avoid timezone issues caused by parsing as UTC. Ensures date is accurate for
	 * the user's local time, otherwise has a chance to return a different day than was
	 * passed in depending on timezone.
	 */
	const [ year, month, day ] = dateString.split( '-' );

	return new Date( Number( year ), Number( month ) - 1, Number( day ) );
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
export function getPreviousDate(
	relativeDate?: unknown,
	daysBefore?: unknown
): string {
	return getDateString(
		dateSub( relativeDate, ( daysBefore as number ) * DAY_IN_SECONDS )
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
export function isValidDateRange( dateRange: string ): boolean {
	const parts = dateRange.split( '-' );

	return (
		parts.length === 3 &&
		parts[ 0 ] === 'last' &&
		! Number.isNaN( parts[ 1 ] as unknown as number ) &&
		! Number.isNaN( parseFloat( parts[ 1 ] ) ) &&
		parts[ 2 ] === 'days'
	);
}

/**
 * Subtracts duration from the prodived date and returns it.
 *
 * @since 1.132.0
 *
 * @param {Date|string} relativeDate Date string (YYYY-MM-DD) or date object to subtract duration from.
 * @param {number}      duration     The duration in seconds to subtract from relativeDate.
 * @return {Date} Resulting date.
 */
export function dateSub( relativeDate: unknown, duration: number ): Date {
	invariant(
		isValidDateString( relativeDate ) ||
			( isDate( relativeDate ) && ! isNaN( Number( relativeDate ) ) ),
		INVALID_DATE_STRING_ERROR
	);

	const timestamp = isValidDateString( relativeDate )
		? stringToDate( relativeDate ).getTime()
		: ( relativeDate as Date ).getTime();

	// Valid use of `new Date()` using calculations.
	// eslint-disable-next-line sitekit/no-direct-date
	return new Date( timestamp - duration * 1000 );
}

/**
 * Gets the first day of a date's month.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString Date in YYYY-MM-DD format.
 * @return {string} First day of the month.
 */
export function getMonthStart( dateString: string ): string {
	const date = stringToDate( dateString );

	date.setDate( 1 );

	return getDateString( date );
}

/**
 * Gets the last day of a date's month.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString Date in YYYY-MM-DD format.
 * @return {string} Last day of the month.
 */
export function getMonthEnd( dateString: string ): string {
	const date = stringToDate( dateString );

	date.setMonth( date.getMonth() + 1, 0 );

	return getDateString( date );
}

/**
 * Adds calendar months, clamping the day to the last day of the target month.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString Date in YYYY-MM-DD format.
 * @param {number} months     Number of months to add (may be negative).
 * @return {string} Resulting date in YYYY-MM-DD format.
 */
export function addMonths( dateString: string, months: number ): string {
	const date = stringToDate( dateString );
	const day = date.getDate();

	// Day zero of the following month is the last day of the target month.
	date.setMonth( date.getMonth() + months + 1, 0 );
	date.setDate( Math.min( day, date.getDate() ) );

	return getDateString( date );
}

/**
 * Adds calendar days without shifting dates at daylight saving transitions.
 *
 * @since n.e.x.t
 *
 * @param {string} dateString Date in YYYY-MM-DD format.
 * @param {number} days       Number of days to add (may be negative).
 * @return {string} Resulting date in YYYY-MM-DD format.
 */
export function addDays( dateString: string, days: number ): string {
	const date = stringToDate( dateString );

	date.setDate( date.getDate() + days );

	return getDateString( date );
}

/**
 * Counts calendar days inclusively, independent of daylight saving changes.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate Start date in YYYY-MM-DD format.
 * @param {string} endDate   End date in YYYY-MM-DD format.
 * @return {number} Inclusive day count.
 */
export function getDayCount( startDate: string, endDate: string ): number {
	// ISO date-only strings parse as UTC, so DST cannot introduce fractional days.
	return (
		( Date.parse( endDate ) - Date.parse( startDate ) ) /
			( DAY_IN_SECONDS * 1000 ) +
		1
	);
}

/**
 * Gets all calendar months touched by a date range, oldest first.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate Start date in YYYY-MM-DD format.
 * @param {string} endDate   End date in YYYY-MM-DD format.
 * @return {string[]} Months in YYYY-MM format.
 */
export function getMonthsInRange(
	startDate: string,
	endDate: string
): string[] {
	const months = [];
	for (
		let date = getMonthStart( startDate );
		date <= endDate;
		date = addMonths( date, 1 )
	) {
		months.push( date.slice( 0, 7 ) );
	}
	return months;
}

/**
 * Resolves a committed or draft selection against a reference date.
 *
 * Clamps both endpoints to the reference date. Unknown selection types resolve
 * to the reference date.
 *
 * @since n.e.x.t
 *
 * @param {DateRangeSelection} selection     Date range selection.
 * @param {string}             referenceDate Reference date in YYYY-MM-DD format.
 * @return {ResolvedDateRange} Resolved start and end dates.
 */
export function resolveDateRangeSelection(
	selection: DateRangeSelection,
	referenceDate: string
): ResolvedDateRange {
	const resolvedDateRange = {
		startDate: referenceDate,
		endDate: referenceDate,
	};

	switch ( selection.type ) {
		case 'preset': {
			const days = selection.slug.split( '-' )[ 1 ];

			resolvedDateRange.startDate = addDays(
				referenceDate,
				1 - Number( days )
			);

			break;
		}
		case 'calendarMonth': {
			const monthStart = `${ selection.month }-01`;

			if ( monthStart < referenceDate ) {
				resolvedDateRange.startDate = monthStart;
			}

			const monthEnd = getMonthEnd( monthStart );

			if ( monthEnd < referenceDate ) {
				resolvedDateRange.endDate = monthEnd;
			}

			break;
		}
		case 'custom':
			if ( selection.startDate < referenceDate ) {
				resolvedDateRange.startDate = selection.startDate;
			}

			if ( selection.endDate < referenceDate ) {
				resolvedDateRange.endDate = selection.endDate;
			}

			break;
	}

	return resolvedDateRange;
}

/**
 * Checks for an actual calendar date in strict YYYY-MM-DD format.
 *
 * @since n.e.x.t
 *
 * @param {unknown} dateString Value to validate.
 * @return {boolean} Whether the value is a valid calendar date.
 */
function isValidCalendarDate( dateString: unknown ): dateString is string {
	return (
		typeof dateString === 'string' &&
		/^\d{4}-\d{2}-\d{2}$/.test( dateString ) &&
		isValidDateString( dateString ) &&
		getDateString( stringToDate( dateString ) ) === dateString
	);
}

/**
 * Validates a selection's shape and explicit dates against the selectable window.
 *
 * @since n.e.x.t
 *
 * @param {unknown} selection     Value to validate.
 * @param {string}  referenceDate Reference date in YYYY-MM-DD format.
 * @return {boolean} Whether the selection is valid and selectable.
 */
export function isValidDateRangeSelection(
	selection: unknown,
	referenceDate: string
): selection is DateRangeSelection {
	if ( ! selection || typeof selection !== 'object' ) {
		return false;
	}
	const range = selection as Partial< DateRangeSelection >;

	switch ( range.type ) {
		case 'preset':
			return (
				typeof range.slug === 'string' && isValidDateRange( range.slug )
			);
		case 'calendarMonth':
			if (
				typeof range.month !== 'string' ||
				! /^\d{4}-(0[1-9]|1[0-2])$/.test( range.month ) ||
				`${ range.month }-01` > referenceDate
			) {
				return false;
			}
			break;
		case 'custom':
			if (
				! isValidCalendarDate( range.startDate ) ||
				! isValidCalendarDate( range.endDate ) ||
				range.startDate > range.endDate ||
				range.endDate > referenceDate
			) {
				return false;
			}
			break;
		default:
			return false;
	}

	const { startDate, endDate } = resolveDateRangeSelection(
		range as DateRangeSelection,
		referenceDate
	);

	const earliestDate = addMonths(
		getMonthStart( referenceDate ),
		1 - DATE_PICKER_LOOKBACK_MONTHS
	);

	return startDate >= earliestDate && startDate <= endDate;
}

/**
 * Formats a date as a localized date in the site locale, e.g. "Jul 28, 2026".
 *
 * Returns an empty string for a missing or invalid date, so the caller can
 * leave out the text that shows it instead of failing to render.
 *
 * @since 1.182.0
 * @since 1.184.0 Moved from `PDFHeader` to a shared helper for use in other PDF components.
 * @since n.e.x.t Moved from PDF to the generic `dates` utils.
 *
 * @param {Date|string} date      Date instance or date string (YYYY-MM-DD) to format.
 * @param {Object}      [options] `Intl.DateTimeFormat` options that override the defaults, e.g. `{ month: 'long' }` for "July 28, 2026".
 * @return {string} Localized date, or an empty string if the date is missing or invalid.
 */
export function formatDate(
	date: unknown,
	options: Intl.DateTimeFormatOptions = {}
): string {
	const dateInstance = isValidDateString( date )
		? stringToDate( date )
		: date;

	if ( ! isDate( dateInstance ) || isNaN( Number( dateInstance ) ) ) {
		return '';
	}

	return new Intl.DateTimeFormat( getLocale(), {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		...options,
	} ).format( dateInstance );
}
