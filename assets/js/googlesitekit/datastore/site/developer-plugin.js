/**
 * `core/site` data store: developer plugin.
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
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const fetchGetDeveloperPluginState = createFetchStore( {
	baseName: 'getDeveloperPluginState',
	controlCallback: () => {
		return API.get( 'core', 'site', 'developer-plugin', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, developerPluginState ) => {
		return {
			...state,
			developerPluginState,
		};
	},
} );

const baseInitialState = {
	developerPluginState: undefined,
};

const baseResolvers = {
	*getDeveloperPluginState() {
		const registry = yield commonActions.getRegistry();

		const existingDeveloperPluginState = registry
			.select( CORE_SITE )
			.getDeveloperPluginState();

		if ( ! existingDeveloperPluginState ) {
			yield fetchGetDeveloperPluginState.actions.fetchGetDeveloperPluginState();
		}
	},
};

const baseSelectors = {
	/**
	 * Gets the developer plugin state info for this site.
	 *
	 * Returns `undefined` if the developer plugin state is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   active: <Boolean>,
	 *   activateURL: <String>,
	 *   configureURL: <String>,
	 *   installURL: <String>,
	 *   installed: <Boolean>,
	 * }
	 * ```
	 *
	 * @since 1.21.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Developer plugin state.
	 */
	getDeveloperPluginState( state ) {
		return state.developerPluginState;
	},
};

const store = combineStores( fetchGetDeveloperPluginState, {
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
