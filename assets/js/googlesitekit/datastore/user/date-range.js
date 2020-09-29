/**
 * core/user data store: date-range.
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
	getPreviousWeekDate,
	isValidDateRange,
	INVALID_DATE_RANGE_ERROR,
} from './utils';

export const initialState = {
	dateRange: 'last-28-days',
};

// Actions
const SET_DATE_RANGE = 'SET_DATE_RANGE';

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
};

export const controls = {};

export function reducer( state, { type, payload } ) {
	switch ( type ) {
		case SET_DATE_RANGE:
			return {
				...state,
				dateRange: payload.slug,
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
	 * @since n.e.x.t
	 *
	 * @typedef {Object} DateRangeReturnObj
	 * @property {string} startDate          Beginning of the original date range.
	 * @property {string} endDate            End of the original date range.
	 * @property {string} [compareStartDate] Beginning of the comparative date range.
	 * @property {string} [compareEndDate]   End of the comparative date range.
	 *
	 * @param {Object}  state                   The current data store's state.
	 * @param {Object}  [options]               Options parameter. Default is: {}.
	 * @param {boolean} [options.compare]       Set to true if date ranges to compare should be included. Default is: false.
	 * @param {number}  [options.offsetDays]    Number of days to offset. Default is: 0.
	 * @param {string}  [options.referenceDate] Used for testing to set a static date. Default is: new Date() (today/now)
	 * @param {boolean} [options.weekDayAlign]  Set to true if the compared date range should be aligned for the weekdays. Default is: false.
	 * @return {DateRangeReturnObj}             Object containing dates for date ranges.
	 */
	getDateRangeDates( state, {
		compare = false,
		offsetDays = 0,
		referenceDate = getDateString( new Date() ),
		weekDayAlign = false,
	} = {} ) {
		const dateRange = selectors.getDateRange( state );
		const endDate = getPreviousDate( referenceDate, offsetDays );
		const matches = dateRange.match( '-(.*)-' );
		const numberOfDays = Number( matches ? matches[ 1 ] : 28 );
		const startDate = getPreviousDate( endDate, numberOfDays - 1 );
		const dates = { startDate, endDate };

		if ( compare ) {
			const compareEndDate = weekDayAlign
				? getPreviousWeekDate( endDate, numberOfDays )
				: getPreviousDate( startDate, 1 );
			const compareStartDate = getPreviousDate( compareEndDate, numberOfDays - 1 );
			dates.compareStartDate = compareStartDate;
			dates.compareEndDate = compareEndDate;
		}

		return dates;
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
