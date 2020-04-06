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
import { STORE_NAME } from '.';

// Actions
const FETCH_ACCOUNTS_PROPERTIES_PROFILES = 'FETCH_ACCOUNTS_PROPERTIES_PROFILES';
const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETED';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_FAILED';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';
const FETCH_CREATE_ACCOUNT = 'FETCH_CREATE_ACCOUNT';
const RECEIVE_CREATE_ACCOUNT = 'RECEIVE_CREATE_ACCOUNT';
const RECEIVE_CREATE_ACCOUNT_FAILED = 'RECEIVE_CREATE_ACCOUNT_FAILED';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
	isSubmittingCreateAccount: false,
};

export const actions = {
	fetchAccountsPropertiesProfiles( data ) {
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

	/**
	 * Creates a new Analytics account.
	 *
	 * Creates a new Analytics account for a user.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} accountName  Google Analytics account name.
	 * @param {string} propertyName Google Analytics property name.
	 * @param {string} profileName  Google Analytics profile name.
	 * @param {string} timezone     Google Analytics timezone.
	 * @return {Function} Generator function action.
	 */
	*createAccount( { accountName, propertyName, profileName, timezone } ) {
		invariant( accountName, 'accountName is required.' );
		invariant( propertyName, 'propertyName is required.' );
		invariant( profileName, 'profileName is required.' );
		invariant( timezone, 'timezone is required.' );

		try {
			const createAccountTicket = yield actions.fetchCreateAccount( { accountName, propertyName, profileName, timezone } );
			return actions.receiveCreateAccount( { accountName, propertyName, profileName, timezone, createAccountTicket } );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveCreateAccountFailed( { accountName, error } );
		}
	},

	fetchCreateAccount( { accountName, propertyName, profileName, timezone } ) {
		return {
			payload: { accountName, propertyName, profileName, timezone },
			type: FETCH_CREATE_ACCOUNT,
		};
	},

	/**
	 * Adds a account ticket to process.
	 *
	 * Adds the newly-created account ticket to the data store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args              Argument params.
	 * @param {Object} args.createAccountTicket  Google Analytics create account ticket object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateAccount( { createAccountTicket } ) {
		invariant( createAccountTicket, 'createAccountTicket is required.' );

		return {
			payload: { createAccountTicket },
			type: RECEIVE_CREATE_ACCOUNT,
		};
	},

	/**
	 * Logs an error with account creation.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args            Argument params.
	 * @param {Object} args.error      Error object.
	 * @return {Object} Redux-style action.
	 */
	receiveCreateAccountFailed( { error } ) {
		return {
			payload: { error },
			type: RECEIVE_CREATE_ACCOUNT_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_ACCOUNTS_PROPERTIES_PROFILES ]: ( { payload } ) => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles', payload.data, {
			useCache: false,
		} );
	},
	[ FETCH_CREATE_ACCOUNT ]: ( { payload: { accountName, propertyName, profileName, timezone } } ) => {
		return API.get( 'modules', 'analytics', 'create-account-ticket', {
			accountName,
			propertyName,
			profileName,
			timezone,
		} );
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

		case FETCH_CREATE_ACCOUNT: {
			return {
				...state,
				isSubmittingCreateAccount: true,
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

		case RECEIVE_CREATE_ACCOUNT:
			const { createAccountTicket } = payload;
			return {
				...state,
				createAccountTicket,
				isSubmittingCreateAccount: false,
			};

		case RECEIVE_CREATE_ACCOUNT_FAILED:
			const { error } = payload;
			return {
				...state,
				isSubmittingCreateAccount: false,
				error,
			};

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
			// If there are already accounts loaded in state, we don't want to make this request
			// and consider this resolver fulfilled.
			if ( ! existingAccounts ) {
				const existingTag = registry.select( STORE_NAME ).getExistingTag() || {};
				const response = yield actions.fetchAccountsPropertiesProfiles( {
					existingAccountID: existingTag.accountID,
					existingPropertyID: existingTag.propertyID,
				} );
				const { accounts, properties, profiles } = response;
				matchedProperty = response.matchedProperty;

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
				registry.dispatch( STORE_NAME ).applyProperty( {
					accountID: matchedProperty.accountId,
					propertyID: matchedProperty.id,
					internalWebPropertyID: matchedProperty.internalWebPropertyId,
				} );
			}
		} catch ( err ) {
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

	/**
	 * Checks whether create account is being submitted.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isSubmittingCreateAccount( state ) {
		return !! state.isSubmittingCreateAccount;
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
