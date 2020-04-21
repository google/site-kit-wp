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
const FETCH_CREATE_ACCOUNT = 'FETCH_CREATE_ACCOUNT';
const CREATE_ACCOUNT_FINISHED = 'CREATE_ACCOUNT_FINISHED';
const RECEIVE_CREATE_ACCOUNT_FAILED = 'RECEIVE_CREATE_ACCOUNT_FAILED';
const CREATE_ACCOUNT_STARTED = 'CREATE_ACCOUNT_STARTED';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
};

export const actions = {
	fetchAccountsPropertiesProfiles() {
		return {
			payload: {},
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

	/**
	 * Creates a new Analytics account.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} args              Argument params.
	 * @param {string} args.accountName  Google Analytics account name.
	 * @param {string} args.propertyName Google Analytics property name.
	 * @param {string} args.profileName  Google Analytics profile name.
	 * @param {string} args.timezone     Google Analytics timezone.
	 * @return {Function} Generator function action.
	 */
	*createAccount( { accountName, propertyName, profileName, timezone } ) {
		invariant( accountName, 'accountName is required.' );
		invariant( propertyName, 'propertyName is required.' );
		invariant( profileName, 'profileName is required.' );
		invariant( timezone, 'timezone is required.' );

		try {
			const accountTicket = yield actions.fetchCreateAccount( { accountName, propertyName, profileName, timezone } );

			return actions.receiveCreateAccount( { accountTicket } );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveCreateAccountFailed( { accountName, error } );
		}
	},

	*fetchCreateAccount( { accountName, propertyName, profileName, timezone } ) {
		yield {
			payload: {},
			type: CREATE_ACCOUNT_STARTED,
		};

		const response = yield {
			payload: { accountName, propertyName, profileName, timezone },
			type: FETCH_CREATE_ACCOUNT,
		};

		yield {
			payload: {},
			type: CREATE_ACCOUNT_FINISHED,
		};

		return response;
	},

	/**
	 * Adds a account ticket to process.
	 *
	 * Adds the newly-created account ticket to the data store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args               Argument params.
	 * @param {Object} args.accountTicket Google Analytics create account ticket object.
	 */
	receiveCreateAccount( { accountTicket } ) {
		invariant( accountTicket, 'accountTicket is required.' );

		// Once we have an account ticket, redirect the user to accept the Terms of Service.
		const { id } = accountTicket;
		if ( id ) {
			// Use `location.assign` so we can test this action in Jest.
			location.assign( `https://analytics.google.com/analytics/web/?provisioningSignup=false#management/TermsOfService/?api.accountTicketId=${ id }` );
		}
	},

	/**
	 * Logs an error with account creation.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} args       Argument params.
	 * @param {Object} args.error Error object.
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
	[ FETCH_ACCOUNTS_PROPERTIES_PROFILES ]: () => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles' );
	},
	[ FETCH_CREATE_ACCOUNT ]: ( { payload: { accountName, propertyName, profileName, timezone } } ) => {
		return API.set( 'modules', 'analytics', 'create-account-ticket', {
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

		case CREATE_ACCOUNT_FINISHED:
			return {
				...state,
				isCreatingAccount: false,
			};

		case RECEIVE_CREATE_ACCOUNT_FAILED:
			const { error } = payload;
			return {
				...state,
				error,
				isCreatingAccount: false,
			};

		case CREATE_ACCOUNT_STARTED: {
			return {
				...state,
				isCreatingAccount: true,
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

			// If there are already accounts loaded in state, we don't want to make this request
			// and consider this resolver fulfilled.
			if ( existingAccounts && existingAccounts.length ) {
				return;
			}

			const response = yield actions.fetchAccountsPropertiesProfiles();
			const { accounts, properties, profiles, matchedProperty } = response;

			yield actions.receiveAccounts( accounts );
			yield registry.dispatch( STORE_NAME ).receiveProperties( properties );
			yield registry.dispatch( STORE_NAME ).receiveProfiles( profiles );

			if ( matchedProperty ) {
				yield registry.dispatch( STORE_NAME ).receiveMatchedProperty( matchedProperty );
			}

			return yield actions.receiveAccountsPropertiesProfilesCompleted();
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
	 * Indicates whether account creation is currently in progress.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if an account is being created, false otherwise.
	 */
	isDoingCreateAccount( state ) {
		return state.isCreatingAccount;
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
