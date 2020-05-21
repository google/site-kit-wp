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

// Actions
const CLEAR_PERMISSION_SCOPE_ERROR = 'CLEAR_PERMISSION_SCOPE_ERROR';
const SET_PERMISSION_SCOPE_ERROR = 'SET_PERMISSION_SCOPE_ERROR';

export const INITIAL_STATE = {
	permissionError: null,
};

export const actions = {
	/**
	 * Clears the permission scope error, if one was previously set.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
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

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {};

export const selectors = {
	/**
	 * Gets the most recent permission error encountered by this user.
	 *
	 * @private
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Permission scope errors. Returns `null` if no error exists.
	 */
	getPermissionScopeError( state ) {
		const { permissionError } = state;
		return permissionError;
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
