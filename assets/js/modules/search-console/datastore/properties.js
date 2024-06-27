/**
 * `modules/search-console` data store: properties.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { commonActions, combineStores } from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { MODULES_SEARCH_CONSOLE } from './constants';

const fetchGetMatchedPropertiesStore = createFetchStore( {
	baseName: 'getMatchedProperties',
	controlCallback: () =>
		API.get(
			'modules',
			'search-console',
			'matched-sites',
			{},
			{ useCache: true }
		),
	reducerCallback: ( state, properties ) => ( { ...state, properties } ),
} );

const baseInitialState = {
	properties: undefined,
};

const baseActions = {};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default:
			return state;
	}
};

const baseResolvers = {
	*getMatchedProperties() {
		const registry = yield commonActions.getRegistry();
		// Only fetch properties if there are none in the store for the given account.
		const properties = registry
			.select( MODULES_SEARCH_CONSOLE )
			.getMatchedProperties();
		if ( properties === undefined ) {
			yield fetchGetMatchedPropertiesStore.actions.fetchGetMatchedProperties();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Search Console properties this account can access.
	 *
	 * @since 1.31.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of Search Console properties; `undefined` if not loaded.
	 */
	getMatchedProperties( state ) {
		return state.properties;
	},
};

const store = combineStores( fetchGetMatchedPropertiesStore, {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	reducer: baseReducer,
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
