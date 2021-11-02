/**
 * `modules/pagespeed-insights` data store: manually-enabled.
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
import Data from 'googlesitekit-data';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { combineStores } = Data;

const fetchGetManuallyEnabledStore = createFetchStore( {
	baseName: 'getManuallyEnabled',
	controlCallback: () => {
		return API.get( 'modules', 'pagespeed-insights', 'manually-enabled' );
	},
	reducerCallback: ( state, manuallyEnabled ) => {
		return {
			...state,
			manuallyEnabled,
		};
	},
} );

const baseInitialState = {
	manuallyEnabled: undefined,
};

const baseResolvers = {
	*getManuallyEnabled() {
		yield fetchGetManuallyEnabledStore.actions.fetchGetManuallyEnabled();
	},
};

const baseSelectors = {
	getManuallyEnabled( state ) {
		const { manuallyEnabled } = state;

		return manuallyEnabled;
	},
};

const store = combineStores( fetchGetManuallyEnabledStore, {
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
