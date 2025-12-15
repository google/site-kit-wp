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
import { get } from 'googlesitekit-api';
import {
	commonActions,
	combineStores,
	createReducer,
} from 'googlesitekit-data';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';

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
		const registry = yield commonActions.getRegistry();

		const checks = registry
			.select( MODULES_SIGN_IN_WITH_GOOGLE )
			.getCompatibilityChecks();

		if ( checks !== undefined ) {
			return;
		}

		yield fetchGetCompatibilityChecksStore.actions.fetchGetCompatibilityChecks();
	},
};

const baseSelectors = {
	/**
	 * Gets the compatibility checks data.
	 *
	 * @since 1.164.0
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
