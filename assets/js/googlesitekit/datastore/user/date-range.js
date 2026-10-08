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
import { commonActions, createReducer } from 'googlesitekit-data';
import {
	DATE_PICKER_LOOKBACK_MONTHS,
	INVALID_DATE_RANGE_ERROR,
	INVALID_DATE_STRING_ERROR,
	addDays,
	addMonths,
	getDateString,
	getDayCount,
	getMonthStart,
	getMonthsInRange,
	isValidDateRange,
	isValidDateRangeSelection,
	isValidDateString,
	resolveDateRangeSelection,
} from '@/js/util';
import { CORE_USER } from './constants';

export const initialState = {
	dateRangeSelection: { type: 'preset', slug: 'last-28-days' },
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
const SET_DATE_RANGE_SELECTION = 'SET_DATE_RANGE_SELECTION';
const SET_REFERENCE_DATE = 'SET_REFERENCE_DATE';

export const actions = {
	/**
	 * Sets a new date range.
	 *
	 * @since 1.12.0
	 *
	 * @param {string} slug Date range slug.
	 * @return {Object} Generator instance.
	 */
	setDateRange( slug ) {
		invariant( slug, 'Date range slug is required.' );
		invariant( isValidDateRange( slug ), INVALID_DATE_RANGE_ERROR );

		return actions.setDateRangeSelection( { type: 'preset', slug } );
	},

	/**
	 * Commits a date range selection within the selectable window.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} selection Date range selection.
	 * @yield {Object} Redux-style action.
	 */
	*setDateRangeSelection( selection ) {
		const registry = yield commonActions.getRegistry();

		const referenceDate = registry.select( CORE_USER ).getReferenceDate();

		invariant(
			isValidDateRangeSelection( selection, referenceDate ),
			'Invalid date range selection.'
		);

		yield {
			type: SET_DATE_RANGE_SELECTION,
			payload: { selection },
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

export const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_DATE_RANGE_SELECTION:
			state.dateRangeSelection = payload.selection;
			break;

		case SET_REFERENCE_DATE:
			state.referenceDate = payload.dateString;
			break;

		default:
			break;
	}
} );

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
		const selection = selectors.getDateRangeSelection( state );

		switch ( selection.type ) {
			case 'preset':
				return selection.slug;
			case 'calendarMonth':
				return `month-${ selection.month }`;
			case 'custom':
				return `custom-${
					selection.endDate
				}-last-${ selectors.getDateRangeNumberOfDays( state ) }-days`;
			default:
				return undefined;
		}
	},

	/**
	 * Returns the current date range as a list of date strings.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object}  state                   The current data store's state.
	 * @param {Object}  [options]               Options parameter. Default is: {}.
	 * @param {boolean} [options.compare]       Set to true if date ranges to compare should be included. Default is: false.
	 * @param {string}  [options.referenceDate] Used for testing to set a static date. Default is the datastore's reference date.
	 * @return {DateRangeReturnObj}             Object containing dates for date ranges.
	 */
	getDateRangeDates(
		state,
		{ compare = false, referenceDate = state.referenceDate } = {}
	) {
		const dates = resolveDateRangeSelection(
			selectors.getDateRangeSelection( state ),
			referenceDate
		);

		const { startDate, endDate } = dates;

		const numberOfDays = getDayCount( startDate, endDate );

		if ( compare ) {
			const compareEndDate = addDays( startDate, -1 );

			const compareStartDate = addDays(
				compareEndDate,
				1 - numberOfDays
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
		const { startDate, endDate } = selectors.getDateRangeDates( state );

		return getDayCount( startDate, endDate );
	},

	/**
	 * Gets the committed date range selection.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state The current data store's state.
	 * @return {Object} Date range selection.
	 */
	getDateRangeSelection( state ) {
		return state.dateRangeSelection;
	},

	/**
	 * Gets the earliest selectable date.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state The current data store's state.
	 * @return {string} First day of the earliest selectable month.
	 */
	getEarliestSelectableDate( state ) {
		return addMonths(
			getMonthStart( state.referenceDate ),
			1 - DATE_PICKER_LOOKBACK_MONTHS
		);
	},

	/**
	 * Gets the latest selectable date.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state The current data store's state.
	 * @return {string} Reference date in YYYY-MM-DD format.
	 */
	getLatestSelectableDate( state ) {
		return selectors.getReferenceDate( state );
	},

	/**
	 * Gets selectable calendar months, newest first.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state The current data store's state.
	 * @return {string[]} Months in YYYY-MM format.
	 */
	getSelectableCalendarMonths( state ) {
		return getMonthsInRange(
			selectors.getEarliestSelectableDate( state ),
			selectors.getLatestSelectableDate( state )
		).reverse();
	},

	/**
	 * Returns the current reference date, typically today.
	 *
	 * @since 1.22.0
	 *
	 * @param {Object} state The current data store's state.
	 * @return {string} The current reference date as YYYY-MM-DD.
	 */
	getReferenceDate( state ) {
		return state.referenceDate;
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
