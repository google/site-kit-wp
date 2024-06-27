/**
 * `core/user` data store: date-range.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import {
	getPreviousDate,
	getDateString,
	isValidDateRange,
	isValidDateString,
	INVALID_DATE_RANGE_ERROR,
	INVALID_DATE_STRING_ERROR,
} from '../../../util/date-range';

export const initialState = {
	dateRange: 'last-28-days',
	// This is where we actually _set_ the reference date (which should
	// have a default value of the current date).
	//
	// Using `new Date()` here is appropriate.
	referenceDate: getDateString( new Date() ), // eslint-disable-line sitekit/no-direct-date
};

/**
 * Date Range Object.
 *
 * @since 1.18.0
 *
 * @typedef {Object} DateRangeReturnObj
 * @property {string} startDate          Beginning of the original date range.
 * @property {string} endDate            End of the original date range.
 * @property {string} [compareStartDate] Beginning of the comparative date range.
 * @property {string} [compareEndDate]   End of the comparative date range.
 */

// Actions
const SET_DATE_RANGE = 'SET_DATE_RANGE';
const SET_REFERENCE_DATE = 'SET_REFERENCE_DATE';

export const actions = {
	/**
	 * Sets a new date range.
	 *
	 * @since 1.12.0
	 *
	 * @param {string} slug Date range slug.
	 * @return {Object} Redux-style action.
	 */
	setDateRange( slug ) {
		invariant( slug, 'Date range slug is required.' );
		invariant( isValidDateRange( slug ), INVALID_DATE_RANGE_ERROR );

		return {
			type: SET_DATE_RANGE,
			payload: {
				slug,
			},
		};
	},

	/**
	 * Sets the current reference date.
	 *
	 * This should only be used for testing, to enforce another reference date
	 * than today.
	 *
	 * @since 1.22.0
	 * @private
	 *
	 * @param {string} dateString Reference date string as YYYY-MM-DD.
	 * @return {Object} Redux-style action.
	 */
	setReferenceDate( dateString ) {
		invariant( dateString, 'Date string is required.' );
		invariant( isValidDateString( dateString ), INVALID_DATE_STRING_ERROR );

		return {
			type: SET_REFERENCE_DATE,
			payload: {
				dateString,
			},
		};
	},
};

export const controls = {};

export function reducer( state, { type, payload } ) {
	switch ( type ) {
		case SET_DATE_RANGE:
			return {
				...state,
				dateRange: payload.slug,
			};
		case SET_REFERENCE_DATE:
			return {
				...state,
				referenceDate: payload.dateString,
			};
		default: {
			return state;
		}
	}
}

export const resolvers = {};

export const selectors = {
	/**
	 * Returns the current date range.
	 *
	 * @since 1.12.0
	 *
	 * @param {Object} state The current data store's state.
	 * @return {string} The current date range slug.
	 */
	getDateRange( state ) {
		const { dateRange } = state;
		return dateRange;
	},

	/**
	 * Returns the current date range as a list of date strings.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object}  state                   The current data store's state.
	 * @param {Object}  [options]               Options parameter. Default is: {}.
	 * @param {boolean} [options.compare]       Set to true if date ranges to compare should be included. Default is: false.
	 * @param {number}  [options.offsetDays]    Number of days to offset. Default is: 0.
	 * @param {string}  [options.referenceDate] Used for testing to set a static date. Default is the datastore's reference date.
	 * @return {DateRangeReturnObj}             Object containing dates for date ranges.
	 */
	getDateRangeDates(
		state,
		{
			compare = false,
			offsetDays,
			referenceDate = state.referenceDate,
		} = {}
	) {
		if ( offsetDays === undefined ) {
			global.console.warn(
				'getDateRangeDates was called without offsetDays'
			);
			offsetDays = 0;
		}

		const dateRange = selectors.getDateRange( state );
		const endDate = getPreviousDate( referenceDate, offsetDays );
		const matches = dateRange.match( '-(.*)-' );
		const numberOfDays = Number( matches ? matches[ 1 ] : 28 );
		const startDate = getPreviousDate( endDate, numberOfDays - 1 );
		const dates = { startDate, endDate };

		if ( compare ) {
			const compareEndDate = getPreviousDate( startDate, 1 );
			const compareStartDate = getPreviousDate(
				compareEndDate,
				numberOfDays - 1
			);
			dates.compareStartDate = compareStartDate;
			dates.compareEndDate = compareEndDate;
		}

		return dates;
	},

	/**
	 * Returns the number of days in the current date range.
	 *
	 * @since 1.26.0
	 *
	 * @param {Object} state The current data store's state.
	 * @return {number}      Integer. The number of days in the current date range.
	 */
	getDateRangeNumberOfDays( state ) {
		const dateRange = selectors.getDateRange( state );
		const matches = dateRange.match( /-(\d+)-/ );
		return parseInt( matches ? matches[ 1 ] : 28, 10 );
	},

	/**
	 * Returns the current reference date, typically today.
	 *
	 * @since 1.22.0
	 * @since 1.130.0 Added options to allow getting the reference date as a Date instance.
	 *
	 * @param {Object} state            The current data store's state.
	 * @param {Object} [options]        Options parameter. Default is: {}.
	 * @param {number} [options.parsed] Number of days to offset. Default is: 0.
	 * @return {string} The current reference date as YYYY-MM-DD.
	 */
	getReferenceDate( state, { parsed = false } = {} ) {
		return parsed ? new Date( state.referenceDate ) : state.referenceDate;
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
