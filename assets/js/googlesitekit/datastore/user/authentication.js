/**
 * core/user Data store: Authentication info.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

const { createRegistrySelector } = Data;

// Actions
const START_FETCH_AUTHENTICATION = 'START_FETCH_AUTHENTICATION';
const FETCH_AUTHENTICATION = 'FETCH_AUTHENTICATION';
const FINISH_FETCH_AUTHENTICATION = 'FINISH_FETCH_AUTHENTICATION';
const CATCH_FETCH_AUTHENTICATION = 'CATCH_FETCH_AUTHENTICATION';
const RECEIVE_AUTHENTICATION = 'RECEIVE_AUTHENTICATION';

export const INITIAL_STATE = {
	authentication: undefined,
	isFetchingAuthentication: false,
};

export const actions = {
	*fetchAuthentication() {
		let response, error;

		yield {
			payload: {},
			type: START_FETCH_AUTHENTICATION,
		};

		try {
			response = yield {
				payload: {},
				type: FETCH_AUTHENTICATION,
			};

			yield actions.receiveAuthentication( response );

			yield {
				payload: {},
				type: FINISH_FETCH_AUTHENTICATION,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_AUTHENTICATION,
			};
		}

		return { response, error };
	},
	/**
	 * Stores connection info received from the REST API.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} authentication Authentication info from the API.
	 * @return {Object} Redux-style action.
	 */
	receiveAuthentication( authentication ) {
		invariant( authentication, 'authentication is required.' );

		return {
			payload: { authentication },
			type: RECEIVE_AUTHENTICATION,
		};
	},

};

export const controls = {
	[ FETCH_AUTHENTICATION ]: () => {
		return API.get( 'core', 'user', 'authentication', undefined, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_AUTHENTICATION: {
			return {
				...state,
				isFetchingAuthentication: true,
			};
		}

		case RECEIVE_AUTHENTICATION: {
			const { authentication } = payload;

			return {
				...state,
				authentication,
			};
		}

		case FINISH_FETCH_AUTHENTICATION: {
			return {
				...state,
				isFetchingAuthentication: false,
			};
		}

		case CATCH_FETCH_AUTHENTICATION: {
			return {
				...state,
				error: payload.error,
				isFetchingAuthentication: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getAuthentication() {
		const { select } = yield Data.commonActions.getRegistry();

		if ( ! select( STORE_NAME ).getAuthentication() ) {
			yield actions.fetchAuthentication();
		}
	},
};

export const selectors = {

	/**
	 * Gets the authentication info for this user.
	 *
	 * Returns `undefined` if the authentication info is not available/loaded.
	 *
	 * Returns an object with the shape when successful:
	 * ```
	 * {
	 *   authenticated: <Boolean>,
	 *   grantedScopes: <Array>,
	 *   requiredScopes: <Array>
	 * }
	 * ```
	 *
	 * @private
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User authentication info.
	 */
	getAuthentication( state ) {
		const { authentication } = state;
		return authentication;
	},
	/**
	 * Gets the Site Kit authentication status for this user.
	 *
	 * Returns `true` if the user is authenticated, `false` if
	 * not. Returns `undefined` if the authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} User authentication status.
	 */
	isAuthenticated: createRegistrySelector( ( select ) => () => {
		const { authenticated } = select( STORE_NAME ).getAuthentication() || {};
		return authenticated;
	} ),

	/**
	 * Gets the granted scopes for the user.
	 *
	 * Returns an array of granted scopes or undefined
	 * if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of granted scopes
	 */
	getGrantedScopes: createRegistrySelector( ( select ) => () => {
		const { grantedScopes } = select( STORE_NAME ).getAuthentication() || {};
		return grantedScopes;
	} ),

	/**
	 * Gets the required scopes for the user.
	 *
	 * Returns an array of required scopes or undefined
	 * if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of required scopes
	 */
	getRequiredScopes: createRegistrySelector( ( select ) => () => {
		const { requiredScopes } = select( STORE_NAME ).getAuthentication() || {};
		return requiredScopes;
	} ),

	/**
	 * Gets the unsatisfied scopes for the user.
	 *
	 * Returns an array of unsatisfied scopes (required but not granted)
	 * or undefined if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of scopes
	 */
	getUnsatisfiedScopes: createRegistrySelector( ( select ) => () => {
		const { unsatisfiedScopes } = select( STORE_NAME ).getAuthentication() || {};
		return unsatisfiedScopes;
	} ),
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
