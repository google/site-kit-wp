/**
 * `core/user` data store: Authentication info.
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
import { get } from 'googlesitekit-api';
import {
	commonActions,
	createRegistrySelector,
	combineStores,
} from 'googlesitekit-data';
import { CORE_USER } from './constants';
import { createFetchStore } from '../../data/create-fetch-store';

function createGetAuthenticationSelector( property ) {
	return createRegistrySelector( ( select ) => () => {
		const data = select( CORE_USER ).getAuthentication() || {};
		return data[ property ];
	} );
}

const fetchGetAuthenticationStore = createFetchStore( {
	baseName: 'getAuthentication',
	controlCallback: () => {
		return get( 'core', 'user', 'authentication', undefined, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, authentication ) => {
		return {
			...state,
			authentication,
		};
	},
} );

// Actions
const SET_AUTH_ERROR = 'SET_AUTH_ERROR';
const CLEAR_AUTH_ERROR = 'CLEAR_AUTH_ERROR';

const baseInitialState = {
	authentication: undefined,
	authError: null,
};

const baseActions = {
	/**
	 * Sets the authentication error.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object} error Authentication error object.
	 * @return {Object} Redux-style action.
	 */
	setAuthError( error ) {
		return {
			payload: { error },
			type: SET_AUTH_ERROR,
		};
	},

	/**
	 * Clears the authentication error, if one was previously set.
	 *
	 * @since 1.18.0
	 *
	 * @return {Object} Redux-style action.
	 */
	clearAuthError() {
		return {
			payload: {},
			type: CLEAR_AUTH_ERROR,
		};
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_AUTH_ERROR: {
			return {
				...state,
				authError: payload.error,
			};
		}

		case CLEAR_AUTH_ERROR: {
			return {
				...state,
				authError: null,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAuthentication() {
		const { select } = yield commonActions.getRegistry();

		if ( ! select( CORE_USER ).getAuthentication() ) {
			yield fetchGetAuthenticationStore.actions.fetchGetAuthentication();
		}
	},
};

const baseSelectors = {
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
	 * @since 1.9.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} User authentication info.
	 */
	getAuthentication( state ) {
		const { authentication } = state;
		return authentication;
	},

	/**
	 * Checks to see if the current user has granted a particular scope.
	 *
	 * Returns `undefined` if the scope info is not available/loaded.
	 *
	 * @since 1.11.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} scope The scope constant to check for.
	 * @return {(boolean|undefined)} `true` if scope is present; `false` if not.
	 */
	hasScope: createRegistrySelector( ( select ) => ( state, scope ) => {
		const grantedScopes = select( CORE_USER ).getGrantedScopes( state );

		if ( grantedScopes === undefined ) {
			return undefined;
		}

		return grantedScopes.includes( scope );
	} ),

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
	isAuthenticated: createGetAuthenticationSelector( 'authenticated' ),

	/**
	 * Gets the granted scopes for the user.
	 *
	 * Returns an array of granted scopes or undefined
	 * if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of granted scopes.
	 */
	getGrantedScopes: createGetAuthenticationSelector( 'grantedScopes' ),

	/**
	 * Gets the required scopes for the user.
	 *
	 * Returns an array of required scopes or undefined
	 * if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of required scopes.
	 */
	getRequiredScopes: createGetAuthenticationSelector( 'requiredScopes' ),

	/**
	 * Gets the unsatisfied scopes for the user.
	 *
	 * Returns an array of unsatisfied scopes (required but not granted)
	 * or undefined if authentication info is not available/loaded.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array|undefined)} Array of scopes.
	 */
	getUnsatisfiedScopes:
		createGetAuthenticationSelector( 'unsatisfiedScopes' ),

	/**
	 * Checks reauthentication status for this user.
	 *
	 * Returns true if any required scopes are not satisfied or undefined
	 * if reauthentication info is not available/loaded.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} User reauthentication status.
	 */
	needsReauthentication: createGetAuthenticationSelector(
		'needsReauthentication'
	),

	/**
	 * Gets the current disconnected reason.
	 *
	 * @since 1.17.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The current disconnected reason.
	 */
	getDisconnectedReason:
		createGetAuthenticationSelector( 'disconnectedReason' ),

	/**
	 * Gets the connected proxy URL.
	 *
	 * @since 1.48.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The current connected proxy URL.
	 */
	getConnectedProxyURL:
		createGetAuthenticationSelector( 'connectedProxyURL' ),

	/**
	 * Gets the previous connected proxy URL.
	 *
	 * @since 1.48.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The previous connected proxy URL.
	 */
	getPreviousConnectedProxyURL: createGetAuthenticationSelector(
		'previousConnectedProxyURL'
	),

	/**
	 * Gets the authentication error.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|null)} Authentication error object if available, otherwise null.
	 */
	getAuthError( state ) {
		const { authError } = state;
		return authError;
	},
};

const store = combineStores( fetchGetAuthenticationStore, {
	initialState: baseInitialState,
	actions: baseActions,
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
