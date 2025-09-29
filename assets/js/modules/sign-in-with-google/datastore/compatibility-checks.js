/**
 * `modules/sign-in-with-google` data store: compatibility-checks.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { combineStores, createReducer } from 'googlesitekit-data';
import { get } from 'googlesitekit-api';

const fetchGetCompatibilityChecksStore = createFetchStore( {
	baseName: 'getCompatibilityChecks',
	controlCallback: () => {
		return get(
			'modules',
			'sign-in-with-google',
			'compatibility-checks',
			null,
			{
				useCache: false,
			}
		);
	},
	reducerCallback: createReducer( ( state, compatibilityChecks ) => {
		state.compatibilityChecks = compatibilityChecks;
	} ),
} );

const baseInitialState = {
	compatibilityChecks: undefined,
};

const baseResolvers = {
	*getCompatibilityChecks() {
		const { select } = yield {
			type: 'GET_REGISTRY',
		};

		if (
			select( 'modules/sign-in-with-google' ).getCompatibilityChecks() !==
			undefined
		) {
			return;
		}

		yield fetchGetCompatibilityChecksStore.actions.fetchGetCompatibilityChecks();
	},
};

const baseSelectors = {
	/**
	 * Gets the compatibility checks data.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|undefined} Compatibility checks data, or `undefined` if not loaded.
	 */
	getCompatibilityChecks: ( state ) => {
		return state.compatibilityChecks;
	},
};

const store = combineStores( fetchGetCompatibilityChecksStore, {
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
