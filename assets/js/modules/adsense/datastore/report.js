/**
 * modules/adsense data store: report.
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

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { options } ) => {
		return API.get( 'modules', 'adsense', 'earnings', options );
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
		invariant( isPlainObject( options ), 'options must be an object.' );
		return { options };
	},
} );

const BASE_INITIAL_STATE = {
	reports: {},
};

const baseResolvers = {
	*getReport( options = {} ) {
		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry.select( STORE_NAME ).getReport( options );

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
	 * Gets a Google AdSense report for the given options.
	 *
	 * The report generated will include the following metrics:
	 * * 'EARNINGS'
	 * * 'PAGE_VIEWS_RPM'
	 * * 'IMPRESSIONS'
	 *
	 * @since 1.9.0
	 *
	 * @param {Object}         state              Data store's state.
	 * @param {Object}         options            Optional. Options for generating the report.
	 * @param {string}         options.dateRange  Date range slug. Default 'last-28-days'.
	 * @param {Array.<string>} options.dimensions Dimensions to use.
	 * @param {number}         options.limit      Maximum number of rows to include.
	 * @return {(Array.<Object>|undefined)} An AdSense report; `undefined` if not loaded.
	 */
	getReport( state, options = {} ) {
		const { reports } = state;

		return reports[ stringifyObject( options ) ];
	},
};

const store = Data.combineStores(
	fetchGetReportStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
