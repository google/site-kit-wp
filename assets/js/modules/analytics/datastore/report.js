/**
 * `modules/analytics` data store: report.
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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { stringifyObject } from '../../../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { isValidDateRange, isValidOrders } from '../../../util/report-validation';
import { isValidDimensions, isValidDimensionFilters, isValidMetrics } from '../util/report-validation';
import { actions as adsenseActions } from './adsense';
import { normalizeReportOptions } from '../util/report-normalization';
import { isRestrictedMetricsError } from '../util/error';

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { options } ) => {
		return API.get( 'modules', 'analytics', 'report', normalizeReportOptions( options ) );
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
		invariant( isPlainObject( options ), 'Options for Analytics report must be an object.' );
		invariant( isValidDateRange( options ), 'Either date range or start/end dates must be provided for Analytics report.' );

		const { metrics, dimensions, dimensionFilters, orderby } = normalizeReportOptions( options );

		invariant( metrics.length, 'Requests must specify at least one metric for an Analytics report.' );
		invariant(
			isValidMetrics( metrics ),
			'Metrics for an Analytics report must be either a string, an array of strings, an object, an array of objects or a mix of strings and objects. If an object is used, it must have "expression" and "alias" properties.',
		);

		if ( dimensions ) {
			invariant(
				isValidDimensions( dimensions ),
				'Dimensions for an Analytics report must be either a string, an array of strings, an object, an array of objects or a mix of strings and objects. If an object is used, it must have "name" property.',
			);
		}

		if ( dimensionFilters ) {
			invariant(
				isValidDimensionFilters( dimensionFilters, dimensions ),
				'Dimension filters must be an object where the keys are valid dimensions.',
			);
		}

		if ( orderby ) {
			invariant(
				isValidOrders( orderby ),
				'Orders for an Analytics report must be either an object or an array of objects where each object should have "fieldName" and "sortOrder" properties.',
			);
		}
	},
} );

const baseInitialState = {
	reports: {},
};

const baseResolvers = {
	*getReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry.select( STORE_NAME ).getReport( options );

		// If there is already a report loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		const { error } = yield fetchGetReportStore.actions.fetchGetReport( options );

		// If the report was requested with AdSense metrics, set `adsenseLinked` accordingly.
		if ( normalizeReportOptions( options ).metrics.some( ( { expression } ) => /^ga:adsense/.test( expression ) ) ) {
			if ( isRestrictedMetricsError( error, 'ga:adsense' ) ) {
				// If the error is a restricted metrics error for AdSense metrics, the services are not linked.
				yield adsenseActions.setAdsenseLinked( false );
			} else {
				// If there is no restricted metrics error OR the restricted metrics error
				// does not cite any AdSense metrics, then the services are linked.
				yield adsenseActions.setAdsenseLinked( true );
			}
		}
	},
};

const baseSelectors = {
	/**
	 * Gets an Analytics report for the given options.
	 *
	 * @since 1.13.0
	 *
	 * @param {Object}         state                       Data store's state.
	 * @param {Object}         options                     Options for generating the report.
	 * @param {string}         options.startDate           Required, unless dateRange is provided. Start date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.endDate             Required, unless dateRange is provided. End date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.dateRange           Required, alternative to startDate and endDate. A date range string such as 'last-28-days'.
	 * @param {boolean}        [options.compareDateRanges] Optional. Only relevant with dateRange. Default false.
	 * @param {boolean}        [options.multiDateRange]    Optional. Only relevant with dateRange. Default false.
	 * @param {Array.<string>} options.metrics             Required. List of metrics to query.
	 * @param {Array.<string>} [options.dimensions]        Optional. List of dimensions to group results by. Default an empty array.
	 * @param {Array.<string>} [options.dimensionFilters]  Optional. List of dimension filters for filtering options on a dimension. Default an empty array.
	 * @param {Array.<Object>} [options.orderby]           Optional. An order definition object, or a list of order definition objects, each one containing 'fieldName' and 'sortOrder'. 'sortOrder' must be either 'ASCENDING' or 'DESCENDING'. Default empty array.
	 * @param {string}         [options.url]               Optional. URL to get a report for only this URL. Default an empty string.
	 * @param {number}         [options.limit]             Optional. Maximum number of entries to return. Default 1000.
	 * @return {(Array.<Object>|undefined)} An Analytics report; `undefined` if not loaded.
	 */
	getReport( state, options ) {
		const { reports } = state;

		return reports[ stringifyObject( options ) ];
	},
};

const store = Data.combineStores(
	fetchGetReportStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
