/**
 * modules/pagespeed-insights data store: report.
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
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetReportStore = createFetchStore( {
	baseName: 'getReport',
	controlCallback: ( { strategy, url } ) => {
		return API.get( 'modules', 'pagespeed-insights', 'pagespeed', { strategy, url } );
	},
	reducerCallback: ( state, report, { strategy, url } ) => {
		return {
			...state,
			reports: {
				...state.reports,
				[ `${ strategy }::${ url }` ]: { ...report },
			},
		};
	},
	argsToParams: ( url, strategy ) => {
		return {
			strategy,
			url,
		};
	},
	validateParams: ( { strategy, url } = {} ) => {
		invariant( isURL( url ), 'a valid url is required to fetch a report.' );
		invariant( typeof strategy === 'string', 'a valid strategy is required to fetch a report.' );
	},
} );

const BASE_INITIAL_STATE = {
	reports: {},
};

const baseResolvers = {
	*getReport( url, strategy ) {
		if ( ! url || ! strategy ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingReport = registry.select( STORE_NAME ).getReport( url, strategy );

		// If there is already a report loaded in state, consider it fulfilled and don't make an API request.
		if ( existingReport ) {
			return;
		}

		yield fetchGetReportStore.actions.fetchGetReport( url, strategy );
	},
};

const baseSelectors = {
	/**
	 * Gets a PageSpeed Insights report for the given strategy and URL.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} url      URL used for generating the report.
	 * @param {string} strategy Strategy used for generating the report.
	 * @return {(Object|undefined)} A PageSpeed Insights report; `undefined` if not loaded.
	 */
	getReport( state, url, strategy ) {
		const { reports } = state;

		return reports[ `${ strategy }::${ url }` ];
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
