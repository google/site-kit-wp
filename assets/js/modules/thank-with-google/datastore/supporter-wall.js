/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { MODULES_THANK_WITH_GOOGLE } from './constants';

const fetchGetSupporterWallSidebars = createFetchStore( {
	baseName: 'getSupporterWallSidebars',
	storeName: MODULES_THANK_WITH_GOOGLE,
	controlCallback: () => {
		return API.get(
			'modules',
			'thank-with-google',
			'supporter-wall-sidebars',
			null,
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, supporterWallSidebars ) => {
		return {
			...state,
			supporterWallSidebars,
		};
	},
} );

const fetchGetSupporterWallPromptStore = createFetchStore( {
	baseName: 'getSupporterWallPrompt',
	storeName: MODULES_THANK_WITH_GOOGLE,
	controlCallback: () => {
		return API.get(
			'modules',
			'thank-with-google',
			'supporter-wall-prompt',
			null,
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, { supporterWallPrompt } ) => {
		return {
			...state,
			supporterWallPrompt,
		};
	},
} );

const baseInitialState = {
	supporterWallSidebars: undefined,
	supporterWallPrompt: undefined,
};

const baseResolvers = {
	*getSupporterWallSidebars() {
		const registry = yield Data.commonActions.getRegistry();
		const sidebars = registry
			.select( MODULES_THANK_WITH_GOOGLE )
			.getSupporterWallSidebars();

		// If there are already sidebars loaded in the state, consider it fulfilled
		// and don't make an API request.
		if ( sidebars !== undefined ) {
			return;
		}

		yield fetchGetSupporterWallSidebars.actions.fetchGetSupporterWallSidebars();
	},

	*getSupporterWallPrompt() {
		const registry = yield Data.commonActions.getRegistry();
		const supporterWallPrompt = registry
			.select( MODULES_THANK_WITH_GOOGLE )
			.getSupporterWallPrompt();

		// If there are already supporterWallPrompt loaded in the state, consider it fulfilled
		// and don't make an API request.
		if ( supporterWallPrompt !== undefined ) {
			return;
		}

		yield fetchGetSupporterWallPromptStore.actions.fetchGetSupporterWallPrompt();
	},
};

const baseSelectors = {
	/**
	 * Gets the list of supporter wall sidebars from the server.
	 *
	 * @since 1.81.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined|null)} Supporter wall sidebars list. Returns undefined if it is not loaded yet.
	 */
	getSupporterWallSidebars( state ) {
		return state.supporterWallSidebars;
	},

	/**
	 * Gets the the supporter wall prompt data from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined| null)} `true` if the transient state for the supporter wall is available, `false` if not; `undefined` if it is not loaded yet.
	 */
	getSupporterWallPrompt( state ) {
		return state.supporterWallPrompt;
	},
};

const store = Data.combineStores(
	fetchGetSupporterWallSidebars,
	fetchGetSupporterWallPromptStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
