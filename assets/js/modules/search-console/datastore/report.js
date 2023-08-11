/**
 * `modules/search-console` data store: report.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { DATE_RANGE_OFFSET, MODULES_SEARCH_CONSOLE } from './constants';
import { stringifyObject } from '../../../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import {
	isValidDateRange,
	isValidStringularItems,
} from '../../../util/report-validation';
import { isZeroReport } from '../util';
import { createGatheringDataStore } from '../../../googlesitekit/modules/create-gathering-data-store';
const { createRegistrySelector } = Data;

/**
 * Returns report args for a sample report.
 *
 * @since 1.107.0
 *
 * @param {Function} select The select function of the registry.
 * @return {Object} Report args.
 */
const getSampleReportArgs = ( select ) => {
	const url = select( CORE_SITE ).getCurrentEntityURL();
	const { compareStartDate: startDate, endDate } = select(
		CORE_USER
	).getDateRangeDates( {
		compare: true,
		offsetDays: DATE_RANGE_OFFSET,
	} );

	const args = {
		startDate,
		endDate,
		dimensions: 'date',
	};

	if ( url ) {
		args.url = url;
	}

	return args;
};

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	storeName: MODULES_SEARCH_CONSOLE,
	controlCallback: ( { options } ) => {
		return API.get(
			'modules',
			'search-console',
			'searchanalytics',
			options
		);
	},
	reducerCallback: ( state, report, { options } ) => {
		return {
			...state,
			reports: {
				...state.reports,
				[ stringifyObject( options ) ]: report,
			},
		};
	},
	argsToParams: ( options ) => {
		return { options };
	},
	validateParams: ( { options } = {} ) => {
		invariant(
			isPlainObject( options ),
			'Options for Search Console report must be an object.'
		);
		invariant(
			isValidDateRange( options ),
			'Either date range or start/end dates must be provided for Search Console report.'
		);

		const { dimensions } = options;
		if ( dimensions ) {
			invariant(
				isValidStringularItems( dimensions ),
				'Dimensions for Search Console report must be either a string or an array of strings'
			);
		}
	},
} );

const gatheringDataStore = createGatheringDataStore( 'search-console', {
	storeName: MODULES_SEARCH_CONSOLE,
	dataAvailable:
		global._googlesitekitModulesData?.[ 'data_available_search-console' ],
	selectDataAvailability: createRegistrySelector( ( select ) => () => {
		const reportArgs = getSampleReportArgs( select );
		// Disable reason: select needs to be called here or it will never run.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const report = select( MODULES_SEARCH_CONSOLE ).getReport( reportArgs );
		const hasResolvedReport = select(
			MODULES_SEARCH_CONSOLE
		).hasFinishedResolution( 'getReport', [ reportArgs ] );

		if ( ! hasResolvedReport ) {
			return undefined;
		}

		const hasReportError = select(
			MODULES_SEARCH_CONSOLE
		).getErrorForSelector( 'getReport', [ reportArgs ] );

		// If there is an error, return `null` since we don't know if there is data or not.
		if ( hasReportError || ! Array.isArray( report ) ) {
			return null;
		}

		if ( report.length ) {
			return true;
		}

		return false;
	} ),
} );

const baseInitialState = {
	reports: {},
};

const baseResolvers = {
	*getReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry
			.select( MODULES_SEARCH_CONSOLE )
			.getReport( options );

		// If there are already alerts loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield fetchGetReportStore.actions.fetchGetReport( options );
	},
};

const baseSelectors = {
	/**
	 * Gets a Search Console report for the given options.
	 *
	 * @since 1.15.0
	 *
	 * @param {Object}         state                       Data store's state.
	 * @param {Object}         options                     Options for generating the report.
	 * @param {string}         options.startDate           Required, unless dateRange is provided. Start date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.endDate             Required, unless dateRange is provided. End date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.dateRange           Required, alternatively to startDate and endDate. A date range string such as 'last-28-days'.
	 * @param {boolean}        [options.compareDateRanges] Optional. Only relevant with dateRange. Default false.
	 * @param {Array.<string>} [options.dimensions]        Optional. List of {@link https://developers.google.com/webmaster-tools/search-console-api-original/v3/searchanalytics/query#dimensionFilterGroups.filters.dimension|dimensions} to group results by. Default an empty array.
	 * @param {string}         [options.url]               Optional. URL to get a report for only this URL. Default an empty string.
	 * @param {number}         [options.limit]             Optional. Maximum number of entries to return. Default 1000.
	 * @return {(Array.<Object>|undefined)} A Search Console report; `undefined` if not loaded.
	 */
	getReport( state, options = {} ) {
		const { reports } = state;

		return reports[ stringifyObject( options ) ];
	},

	/**
	 * Determines whether the Search Console has zero data or not.
	 *
	 * @since 1.68.0
	 *
	 * @return {boolean|undefined} Returns FALSE if not gathering data and the report is not zero, otherwise TRUE. If the request is still being resolved, returns undefined.
	 */
	hasZeroData: createRegistrySelector( ( select ) => () => {
		const isGatheringData = select(
			MODULES_SEARCH_CONSOLE
		).isGatheringData();

		if ( isGatheringData === undefined ) {
			return undefined;
		}

		if ( isGatheringData === true ) {
			return true;
		}

		const args = getSampleReportArgs( select );

		// Disable reason: select needs to be called here or it will never run.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const report = select( MODULES_SEARCH_CONSOLE ).getReport( args );

		const hasResolvedReport = select(
			MODULES_SEARCH_CONSOLE
		).hasFinishedResolution( 'getReport', [ args ] );

		if ( ! hasResolvedReport ) {
			return undefined;
		}

		if ( ! Array.isArray( report ) ) {
			return false;
		}

		return isZeroReport( report );
	} ),
};

const store = Data.combineStores( fetchGetReportStore, gatheringDataStore, {
	initialState: baseInitialState,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
