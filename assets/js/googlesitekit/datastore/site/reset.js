/**
 * `core/site` data store: reset connection.
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
import { set } from 'googlesitekit-api';
import { createRegistrySelector, combineStores } from 'googlesitekit-data';
import { CORE_SITE } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

const fetchResetStore = createFetchStore( {
	baseName: 'reset',
	controlCallback: () => {
		return set( 'core', 'site', 'reset' );
	},
} );

const baseInitialState = {};

const baseActions = {
	/**
	 * Resets the website's connection info to Site Kit.
	 *
	 * WARNING: This causes the website's connection with Google Site Kit to be
	 * removed and will require re-authentication. Use this action with caution,
	 * and always request user confirmation before dispatching.
	 *
	 * @since 1.5.0
	 */
	*reset() {
		yield fetchResetStore.actions.fetchReset();
	},
};

const baseSelectors = {
	/**
	 * Checks if reset action is in-process.
	 *
	 * @since 1.5.0
	 *
	 * @return {boolean} `true` if resetting is in-flight; `false` if not.
	 */
	isDoingReset: createRegistrySelector( ( select ) => () => {
		return select( CORE_SITE ).isFetchingReset();
	} ),
};

const store = combineStores( fetchResetStore, {
	initialState: baseInitialState,
	actions: baseActions,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
