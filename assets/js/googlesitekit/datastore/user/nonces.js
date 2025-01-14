/**
 * `core/user` data store: nonces.
 *
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
import {
	commonActions,
	createRegistrySelector,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

// Actions
const RECEIVE_NONCES = 'RECEIVE_NONCES';

const fetchGetNoncesStore = createFetchStore( {
	baseName: 'getNonces',
	controlCallback: () => {
		return API.get( 'core', 'user', 'nonces', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, nonces ) => ( {
		...state,
		nonces,
	} ),
} );

const baseInitialState = {
	nonces: undefined,
};

const baseActions = {
	/**
	 * Sets nonces.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} nonces Dictionary of keys and their nonces.
	 * @return {Object} Redux-style action.
	 */
	receiveNonces( nonces ) {
		return {
			type: RECEIVE_NONCES,
			payload: { nonces },
		};
	},
};

const baseControls = {};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_NONCES: {
			const { nonces } = payload;

			return {
				...state,
				nonces,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getNonces() {
		const registry = yield commonActions.getRegistry();

		if ( registry.select( CORE_USER ).getNonces() ) {
			return;
		}

		yield fetchGetNoncesStore.actions.fetchGetNonces();
	},
};

const baseSelectors = {
	/**
	 * Gets all nonces from the store.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Nonces object. Returns undefined if it is not loaded yet.
	 */
	getNonces( state ) {
		const { nonces } = state;
		return nonces;
	},

	/**
	 * Gets a single nonce from the store.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} nonce Action name of the nonce to get.
	 * @return {(string|undefined)} Nonce string. Returns undefined if this nonce is not loaded yet.
	 */
	getNonce: createRegistrySelector( ( select ) => ( state, nonce ) => {
		const nonces = select( CORE_USER ).getNonces();

		if ( ! nonces ) {
			return undefined;
		}

		return nonces[ nonce ];
	} ),
};

const store = combineStores( fetchGetNoncesStore, {
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
