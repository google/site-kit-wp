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
const START_FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'START_FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const FINISH_FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'FINISH_FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const CATCH_FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'CATCH_FETCH_ACCOUNTS_PROPERTIES_PROFILES';

const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
};

export const actions = {
	*fetchAccountsPropertiesProfiles( data ) {
		let response, error;

		yield {
			payload: { data },
			type: START_FETCH_ACCOUNTS_PROPERTIES_PROFILES,
		};

		try {
			response = yield {
				payload: { data },
				type: FETCH_ACCOUNTS_PROPERTIES_PROFILES,
			};

			const { dispatch } = yield Data.commonActions.getRegistry();
			yield actions.receiveAccounts( response.accounts );
			dispatch( STORE_NAME ).receiveProperties( response.properties );
			dispatch( STORE_NAME ).receiveProfiles( response.profiles );

			if ( response.matchedProperty ) {
				dispatch( STORE_NAME ).receiveMatchedProperty( response.matchedProperty );
			}

			yield {
				payload: { data },
				type: FINISH_FETCH_ACCOUNTS_PROPERTIES_PROFILES,
			};
		} catch ( e ) {
			error = e;

			yield {
				payload: {
					data,
					error,
				},
				type: CATCH_FETCH_ACCOUNTS_PROPERTIES_PROFILES,
			};
		}

		return { response, error };
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
		case START_FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
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

		case FINISH_FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
			return {
				...state,
				isFetchingAccountsPropertiesProfiles: false,
			};
		}

		case CATCH_FETCH_ACCOUNTS_PROPERTIES_PROFILES: {
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
		const registry = yield Data.commonActions.getRegistry();
		const existingAccounts = registry.select( STORE_NAME ).getAccounts();
		let matchedProperty = registry.select( STORE_NAME ).getMatchedProperty();

		// Only fetch accounts if there are none in the store.
		if ( ! existingAccounts ) {
			yield tagActions.waitForExistingTag();
			const existingTag = registry.select( STORE_NAME ).getExistingTag();
			const { response, error } = yield actions.fetchAccountsPropertiesProfiles( {
				existingPropertyID: existingTag,
			} );

			if ( response ) {
				( { matchedProperty } = response );
			} else if ( error ) {
				/**
				 * Not the best check here, but this message comes from the Google API.
				 * err.data.reason is also 'insufficientPermissions' but that isn't as clear,
				 * and may not be "no accounts".
				 *
				 * @see {@link https://github.com/google/site-kit-wp/issues/1368}
				 */
				if ( error.message && error.message === 'User does not have any Google Analytics account.' ) {
					yield actions.receiveAccounts( [] );
				}
			}
		}

		const accountID = registry.select( STORE_NAME ).getAccountID();
		// Pre-select values from the matched property if no account is selected.
		if ( matchedProperty && ! accountID ) {
			registry.dispatch( STORE_NAME ).setAccountID( matchedProperty.accountId ); // Capitalization rule exception: accountId
			registry.dispatch( STORE_NAME ).selectProperty( matchedProperty.id, matchedProperty.internalWebPropertyId ); // Capitalization rule exception: internalWebPropertyId
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
