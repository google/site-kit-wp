/**
 * `modules/analytics-4` data store: pivotReport.
 *
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { combineStores, wpControls } from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { MODULES_ANALYTICS_4 } from './constants';
import { stringifyObject } from '../../../util';
import { normalizeReportOptions } from '../utils';
import { validatePivotReport } from '../utils/validation';

const fetchGetReportStore = createFetchStore( {
	baseName: 'getPivotReport',
	controlCallback: ( { options } ) => {
		return API.get(
			'modules',
			'analytics-4',
			'pivot-report',
			normalizeReportOptions( options )
		);
	},
	reducerCallback: ( state, report, { options } ) => {
		return {
			...state,
			pivotReports: {
				...state.pivotReports,
				[ stringifyObject( options ) ]: report,
			},
		};
	},
	argsToParams: ( options ) => {
		return { options };
	},
	validateParams: ( { options } = {} ) => validatePivotReport( options ),
} );

const baseInitialState = {
	pivotReports: {},
};

const baseResolvers = {
	*getPivotReport( options = {} ) {
		const existingReport = yield wpControls.select(
			MODULES_ANALYTICS_4,
			'getPivotReport',
			options
		);

		// If there is already a report loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield fetchGetReportStore.actions.fetchGetPivotReport( options );
	},
};

const baseSelectors = {
	/**
	 * Gets an Analytics pivot report for the given options.
	 *
	 * @since 1.130.0
	 *
	 * @param {Object}         state                      Data store's state.
	 * @param {Object}         options                    Options for generating the report.
	 * @param {string}         options.startDate          Required. Start date to query report data for as YYYY-mm-dd.
	 * @param {string}         options.endDate            Required. End date to query report data for as YYYY-mm-dd.
	 * @param {Array.<string>} options.metrics            Required. List of metrics to query.
	 * @param {Array.<string>} options.dimensions         Required. List of dimensions to group results by.
	 * @param {Array.<string>} options.pivots             Required. List of pivots to structure the report data into columns.
	 * @param {Object}         [options.dimensionFilters] Optional. Map of dimension filters for filtering options on a dimension. Default an empty object.
	 * @param {Object}         [options.metricFilters]    Optional. Map of metric filters for filtering options on a metric. Default an empty object.
	 * @param {string}         [options.url]              Optional. URL to get a report for only this URL. Default an empty string.
	 * @return {(Array.<Object>|undefined)} An Analytics report; `undefined` if not loaded.
	 */
	getPivotReport( state, options ) {
		const { pivotReports } = state;

		return pivotReports[ stringifyObject( options ) ];
	},
};

const store = combineStores( fetchGetReportStore, {
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
