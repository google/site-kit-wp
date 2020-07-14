/**
 * File Contents Description.
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

// Actions
const SET_REGISTRY_KEY = 'SET_REGISTRY_KEY';

const INITIAL_STATE = {
	registryKey: undefined,
};

export const actions = {
	/**
	 * Sets the registryKey in the data store.
	 *
	 * @since n.e.x.t
	 *
	 * @param {(number|undefined)} registryKey The registryKey for a given store.
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

/**
 * Registry reducer.
 *
 * @since n.e.x.t
 *
 * @param {Object}             state          Data store's state.
 * @param {Object}             action         Redux-style action.
 * @param {(number|undefined)} action.payload The registryKey for a given store.
 * @param {string}             action.type    The action type.
 * @return {Object} Data store's state
 */
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
			return { ...state };
		}
	}
};

export const selectors = {
	/**
	 * Returns the registry key being used for a given store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|undefined)} The registryKey for a given store.
	 */
	getRegistryKey( state ) {
		const { registryKey } = state;

		return registryKey;
	},
};

export default {
	INITIAL_STATE,
	actions,
	reducer,
	selectors,
};
