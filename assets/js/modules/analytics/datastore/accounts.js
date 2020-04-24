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
const FETCH_CREATE_ACCOUNT = 'FETCH_CREATE_ACCOUNT';
const RECEIVE_CREATE_ACCOUNT = 'RECEIVE_CREATE_ACCOUNT';
const START_FETCH_CREATE_ACCOUNT = 'START_FETCH_CREATE_ACCOUNT';
const FINISH_FETCH_CREATE_ACCOUNT = 'FINISH_FETCH_CREATE_ACCOUNT';
const CATCH_FETCH_CREATE_ACCOUNT = 'CATCH_FETCH_CREATE_ACCOUNT';

const RECEIVE_ACCOUNTS = 'RECEIVE_ACCOUNTS';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

export const INITIAL_STATE = {
	accounts: undefined,
	isFetchingAccountsPropertiesProfiles: false,
	isFetchingCreateAccount: false,
	accountTicketTermsOfServiceURL: undefined,
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

		let response,
			error;
		yield {
			payload: {},
			type: START_FETCH_CREATE_ACCOUNT,
		};

		try {
			response = yield {
				payload: { accountName, propertyName, profileName, timezone },
				type: FETCH_CREATE_ACCOUNT,
			};

			yield actions.receiveCreateAccount( response );

			yield {
				payload: {},
				type: FINISH_FETCH_CREATE_ACCOUNT,
			};
		} catch ( e ) {
			error = e;
			yield {
				payload: { error },
				type: CATCH_FETCH_CREATE_ACCOUNT,
			};
		}
		return { response, error };
	},

	receiveCreateAccount( accountTicket ) {
		invariant( accountTicket, 'accountTicket is required.' );

		return {
			payload: { accountTicket },
			type: RECEIVE_CREATE_ACCOUNT,
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

		case FINISH_FETCH_CREATE_ACCOUNT:
			return {
				...state,
				isFetchingCreateAccount: false,
			};

		case CATCH_FETCH_CREATE_ACCOUNT:
			const { error } = payload;
			return {
				...state,
				error,
				isFetchingCreateAccount: false,
			};

		case START_FETCH_CREATE_ACCOUNT: {
			return {
				...state,
				isFetchingCreateAccount: true,
			};
		}

		case RECEIVE_CREATE_ACCOUNT: {
			const { accountTicket: { id } } = payload;
			return {
				...state,
				accountTicketTermsOfServiceURL: `https://analytics.google.com/analytics/web/?provisioningSignup=false#management/TermsOfService/&api.accountTicketId=${ id }`,
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
			const { response } = yield actions.fetchAccountsPropertiesProfiles( {
				existingPropertyID: existingTag,
			} );

			if ( response ) {
				( { matchedProperty } = response );
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
	isDoingGetAccounts( state ) {
		return !! state.isFetchingAccountsPropertiesProfiles;
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
		return !! state.isFetchingCreateAccount;
	},

	/**
	 * Get the terms of service URL.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} The terms of service URL.
	 */
	getAccountTicketTermsOfServiceURL( state ) {
		return state.accountTicketTermsOfServiceURL;
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
