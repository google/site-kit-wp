/**
 * File Contents Description.
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
 * External dependencies
 */
import invariant from 'invariant';
import { v4 as uuidv4 } from 'uuid';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from './constants';

// Actions
const SET_REGISTRY_KEY = 'SET_REGISTRY_KEY';

const initialState = {
	registryKey: undefined,
};

export const actions = {
	/**
	 * Sets the registryKey in the data store.
	 *
	 * @since 1.13.0
	 *
	 * @param {string} registryKey The registryKey for a given store.
	 * @return {Object} Redux-style action.
	 */
	setRegistryKey( registryKey ) {
		invariant( registryKey, 'registryKey is required.' );
		return {
			payload: { registryKey },
			type: SET_REGISTRY_KEY,
		};
	},
};

export const reducer = ( state, { payload, type } ) => {
	switch ( type ) {
		case SET_REGISTRY_KEY: {
			const { registryKey } = payload;
			return {
				...state,
				registryKey,
			};
		}
		default: {
			return state;
		}
	}
};

const resolvers = {
	*getRegistryKey() {
		const registry = yield Data.commonActions.getRegistry();

		let registryKey = registry.select( CORE_SITE ).getRegistryKey();

		if ( ! registryKey ) {
			registryKey = uuidv4();
			registry.dispatch( CORE_SITE ).setRegistryKey( registryKey );
		}
	},
};

export const selectors = {
	/**
	 * Returns the registry key being used for a given store.
	 *
	 * @since 1.13.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The registryKey for a given store. Returns `undefined` if the key has not yet been set.
	 */
	getRegistryKey( state ) {
		const { registryKey } = state;
		return registryKey;
	},
};

export default {
	initialState,
	actions,
	resolvers,
	reducer,
	selectors,
};
