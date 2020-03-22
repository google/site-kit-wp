/**
 * modules/analytics data store: accounts.
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

// Actions
const FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
};

export const actions = {
	*fetchAccountsPropertiesProfiles() {
		return {
			payload: {},
			type: FETCH_ACCOUNTS_PROPERTIES_PROFILES,
		};
	},

	receiveAccountsPropertiesProfiles( { accounts, properties, profiles } ) {
		return {
			payload: { accounts, properties, profiles },
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES,
		};
	},

	receiveAccountsPropertiesProfilesFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_ACCOUNTS_PROPERTIES_PROFILES ]: () => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles' );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: true,
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES: {
			const { accounts, properties, profiles } = payload;

			const updatedState = {
				...state,
				accounts,
				isFetchingAccountsPropertiesProfiles: false,
				properties,
			};

			// If profiles are returned, determine their property ID.
			if ( profiles.length ) {
				updatedState.profiles = {
					...state.profiles || {},
					[ `${ profiles[ 0 ].accountId }::${ profiles[ 0 ].webPropertyId }` ]: profiles, // Capitalization rule exception: `accountId` and `webPropertyId` are properties of an API returned value.
				};
			}

			return updatedState;
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingAccountsPropertiesProfiles: false,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getAccounts() {
		try {
			const response = yield actions.fetchAccountsPropertiesProfiles();
			const { accounts, properties, profiles } = response;

			yield actions.receiveAccountsPropertiesProfiles( { accounts, properties, profiles } );

			return;
		} catch ( err ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveAccountsPropertiesProfilesFailed( err );
		}
	},
};

export const selectors = {
	/**
	 * Get all Google Analytics accounts this user can access.
	 *
	 * Returns an array of all analytics accounts.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array|undefined} An array of Analytics accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Get an errors encountered by this store or its side effects.
	 *
	 * Returns an object with the shape when there is an error:
	 * ```
	 * {
	 *   code,
	 *   message,
	 * }
	 * ```
	 *
	 * Returns `null` if there was no error.
	 *
	 * Marked as private, because in the future we'll have more robust error
	 * handling.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {Object|null} Any error encountered with requests in state.
	 */
	getError( state ) {
		const { error } = state;
		return error || null;
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
