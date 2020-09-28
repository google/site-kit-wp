/**
 * core/user Data store: permission scopes.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
const { createRegistrySelector } = Data;

// Actions
const CLEAR_PERMISSION_SCOPE_ERROR = 'CLEAR_PERMISSION_SCOPE_ERROR';
const SET_PERMISSION_SCOPE_ERROR = 'SET_PERMISSION_SCOPE_ERROR';
const RECEIVE_CAPABILITIES = 'RECEIVE_CAPABILITIES';

export const initialState = {
	permissionError: null,
	capabilities: undefined,
};

export const actions = {
	/**
	 * Clears the permission scope error, if one was previously set.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @return {Object} Redux-style action.
	 */
	clearPermissionScopeError() {
		return {
			payload: {},
			type: CLEAR_PERMISSION_SCOPE_ERROR,
		};
	},

	/**
	 * Sets a permission error encountered by an API request.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} permissionError Permissions error object.
	 * @return {Object} Redux-style action.
	 */
	setPermissionScopeError( permissionError ) {
		invariant( permissionError, 'permissionError is required.' );

		return {
			payload: { permissionError },
			type: SET_PERMISSION_SCOPE_ERROR,
		};
	},

	/**
	 * Sets user capabilities.
	 *
	 * @since 1.13.0
	 * @private
	 *
	 * @param {Object} capabilities User capabilities.
	 * @return {Object} Redux-style action.
	 */
	receiveCapabilities( capabilities ) {
		return {
			type: RECEIVE_CAPABILITIES,
			payload: { capabilities },
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case CLEAR_PERMISSION_SCOPE_ERROR: {
			return {
				...state,
				permissionError: null,
			};
		}

		case SET_PERMISSION_SCOPE_ERROR: {
			const { permissionError } = payload;

			return {
				...state,
				permissionError,
			};
		}

		case RECEIVE_CAPABILITIES: {
			const { capabilities } = payload;

			return {
				...state,
				capabilities,
			};
		}

		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getCapabilities() {
		const registry = yield Data.commonActions.getRegistry();

		if ( registry.select( STORE_NAME ).getCapabilities() ) {
			return;
		}

		if ( ! global._googlesitekitUserData?.permissions ) {
			global.console.error( 'Could not load core/user permissions.' );
		}

		yield actions.receiveCapabilities( global._googlesitekitUserData?.permissions );
	},
};

export const selectors = {
	/**
	 * Gets the most recent permission error encountered by this user.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Permission scope errors. Returns `null` if no error exists.
	 */
	getPermissionScopeError( state ) {
		const { permissionError } = state;
		return permissionError;
	},

	/**
	 * Gets capabilities of the current user.
	 *
	 * @since 1.13.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Capabilities object. Returns undefined if it is not loaded yet.
	 */
	getCapabilities( state ) {
		const { capabilities } = state;
		return capabilities;
	},

	/**
	 * Checks if the current user has the specified capability or not.
	 *
	 * @since 1.13.0
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} capability Capability name to check.
	 * @return {(boolean|undefined)} TRUE if the current user has this capability, otherwise FALSE. If capabilities ain't loaded yet, returns undefined.
	 */
	hasCapability: createRegistrySelector( ( select ) => ( state, capability ) => {
		const capabilities = select( STORE_NAME ).getCapabilities();
		if ( capabilities ) {
			return !! capabilities[ capability ];
		}

		return undefined;
	} ),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
