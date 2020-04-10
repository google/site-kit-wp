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
import Data from 'googlesitekit-data';
import { isValidAccountSelection } from '../util';
import { STORE_NAME, ACCOUNT_CREATE, PROPERTY_CREATE } from './constants';
import { actions as tagActions } from './tags';

// Actions
const FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const FETCH_ACCOUNTS_PROPERTIES_PROFILES_STARTED = 'FETCH_ACCOUNTS_PROPERTIES_PROFILES_STARTED';
const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
};

export const actions = {
	*fetchAccountsPropertiesProfiles( data ) {
		yield {
			payload: {
				data,
			},
			type: FETCH_ACCOUNTS_PROPERTIES_PROFILES_STARTED,
		};

		return {
			payload: {
				data,
			},
			type: FETCH_ACCOUNTS_PROPERTIES_PROFILES,
		};
	},

	/**
	 * Creates an action for receiving accounts.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Array} accounts Accounts to receive.
	 * @return {Object} action object.
	 */
	receiveAccounts( accounts ) {
		invariant( Array.isArray( accounts ), 'accounts must be an array.' );

		return {
			payload: { accounts },
			type: RECEIVE_ACCOUNTS,
		};
	},

	receiveAccountsPropertiesProfilesCompleted() {
		return {
			payload: {},
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED,
		};
	},

	receiveAccountsPropertiesProfilesFailed( error ) {
		invariant( error, 'error is required.' );

		return {
			payload: { error },
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED,
		};
	},

	*resetAccounts() {
		const registry = yield Data.commonActions.getRegistry();

		yield { type: RESET_ACCOUNTS };

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getAccounts' );
	},

	*selectAccount( accountID ) {
		invariant( isValidAccountSelection( accountID ), 'A valid accountID is required to select.' );

		const registry = yield Data.commonActions.getRegistry();
		registry.dispatch( STORE_NAME ).setAccountID( accountID );
		registry.dispatch( STORE_NAME ).setPropertyID( '' );
		registry.dispatch( STORE_NAME ).setInternalWebPropertyID( '' );
		registry.dispatch( STORE_NAME ).setProfileID( '' );

		if ( ACCOUNT_CREATE === accountID ) {
			return;
		}

		// Trigger cascading selections.
		const properties = registry.select( STORE_NAME ).getProperties( accountID );
		if ( properties === undefined ) {
			return; // Selection will happen in resolver.
		}
		const property = properties[ 0 ] || { id: PROPERTY_CREATE };
		registry.dispatch( STORE_NAME ).selectProperty( property.id );
	},
};

export const controls = {
	[ FETCH_ACCOUNTS_PROPERTIES_PROFILES ]: ( { payload } ) => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles', payload.data, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_ACCOUNTS_PROPERTIES_PROFILES_STARTED: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: true,
			};
		}

		case RECEIVE_ACCOUNTS: {
			const { accounts } = payload;

			return {
				...state,
				accounts: [ ...accounts ],
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: false,
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED: {
			const { error } = payload;

			return {
				...state,
				error,
				isFetchingAccountsPropertiesProfiles: false,
			};
		}

		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: undefined,
				settings: {
					...state.settings,
					accountID: undefined,
					propertyID: undefined,
					internalWebPropertyID: undefined,
					profileID: undefined,
				},
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
			const registry = yield Data.commonActions.getRegistry();

			const existingAccounts = registry.select( STORE_NAME ).getAccounts();
			let matchedProperty = registry.select( STORE_NAME ).getMatchedProperty();

			// Only fetch accounts if there are none in the store.
			if ( ! existingAccounts ) {
				yield tagActions.waitForExistingTag();
				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				const { accounts, properties, profiles, ...response } = yield actions.fetchAccountsPropertiesProfiles( {
					existingPropertyID: existingTag,
				} );
				( { matchedProperty } = response );

				yield actions.receiveAccounts( accounts );
				registry.dispatch( STORE_NAME ).receiveProperties( properties );
				registry.dispatch( STORE_NAME ).receiveProfiles( profiles );

				if ( matchedProperty ) {
					registry.dispatch( STORE_NAME ).receiveMatchedProperty( matchedProperty );
				}

				yield actions.receiveAccountsPropertiesProfilesCompleted();
			}

			const accountID = registry.select( STORE_NAME ).getAccountID();
			// Pre-select values from the matched property if no account is selected.
			if ( matchedProperty && ! accountID ) {
				registry.dispatch( STORE_NAME ).setAccountID( matchedProperty.accountId );
				registry.dispatch( STORE_NAME ).selectProperty( matchedProperty.id, matchedProperty.internalWebPropertyId );
			}
		} catch ( err ) {
			// Not the best check here, but this message comes from the API.
			// err.data.reason is also 'insufficientPermissions' but that isn't as clear,
			// and may not be "no accounts".
			if ( err.message && err.message === 'User does not have any Google Analytics account.' ) {
				yield actions.receiveAccounts( [] );
			}

			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveAccountsPropertiesProfilesFailed( err );
		}
	},
};

export const selectors = {
	/**
	 * Gets all Google Analytics accounts this user can access.
	 *
	 * Returns an array of all analytics accounts.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of Analytics accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Gets an error encountered by this store or its side effects.
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
	 * @return {?Object} Any error encountered with requests in state.
	 */
	getError( state ) {
		const { error } = state;

		return error || null;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isFetchingAccounts( state ) {
		return !! state.isFetchingAccountsPropertiesProfiles;
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
