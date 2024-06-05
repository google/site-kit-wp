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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { MODULES_ANALYTICS_4 } from './constants';
import { stringifyObject } from '../../../util';
import { isValidDateRange } from '../../../util/report-validation';
import {
	normalizeReportOptions,
	isValidDimensionFilters,
	isValidDimensions,
	isValidMetrics,
	isValidMetricFilters,
	isValidPivots,
} from '../utils';

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
	validateParams: ( { options } = {} ) => {
		invariant(
			isPlainObject( options ),
			'options for Analytics 4 report must be an object.'
		);
		invariant(
			isValidDateRange( options ),
			'Either date range or start/end dates must be provided for Analytics 4 report.'
		);

		const {
			metrics,
			dimensions,
			dimensionFilters,
			metricFilters,
			pivots,
			orderby,
			limit,
		} = normalizeReportOptions( options );

		invariant(
			metrics.length,
			'Requests must specify at least one metric for an Analytics 4 report.'
		);
		invariant(
			isValidMetrics( metrics ),
			'metrics for an Analytics 4 report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property. Metric names must match the expression ^[a-zA-Z0-9_]+$.'
		);
		invariant(
			isValidPivots( pivots ),
			'pivots for an Analytics 4 report must be an array of objects. Each object must have a "fieldNames" property and a "limit".'
		);

		if ( orderby ) {
			invariant(
				Array.isArray( orderby ),
				'orderby for an Analytics 4 pivot report must be passed within a pivot.'
			);
		}
		if ( limit ) {
			invariant(
				typeof limit === 'number',
				'limit for an Analytics 4 pivot report must be passed within a pivot.'
			);
		}

		if ( dimensions ) {
			invariant(
				isValidDimensions( dimensions ),
				'dimensions for an Analytics 4 report must be either a string, an array of strings, an object, an array of objects, or a mix of strings and objects. Objects must have a "name" property.'
			);
		}

		if ( dimensionFilters ) {
			invariant(
				isValidDimensionFilters( dimensionFilters ),
				'dimensionFilters for an Analytics 4 report must be a map of dimension names as keys and dimension values as values.'
			);
		}

		if ( metricFilters ) {
			invariant(
				isValidMetricFilters( metricFilters ),
				'metricFilters for an Analytics 4 report must be a map of metric names as keys and filter value(s) as numeric fields, depending on the filterType.'
			);
		}
	},
} );

const baseInitialState = {
	pivotReports: {},
};

const baseResolvers = {
	*getPivotReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry
			.select( MODULES_ANALYTICS_4 )
			.getPivotReport( options );

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
	 * @since n.e.x.t
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

const store = Data.combineStores( fetchGetReportStore, {
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
