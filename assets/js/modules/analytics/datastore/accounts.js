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
import isPlainObject from 'lodash/isPlainObject';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { isValidAccountSelection } from '../util';
import { STORE_NAME, ACCOUNT_CREATE, PROPERTY_CREATE, FORM_ACCOUNT_CREATE } from './constants';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as tagActions } from './tags';
const { createRegistrySelector } = Data;

const fetchGetAccountsPropertiesProfilesStore = createFetchStore( {
	baseName: 'getAccountsPropertiesProfiles',
	controlCallback: ( { data } ) => {
		return API.get( 'modules', 'analytics', 'accounts-properties-profiles', data, {
			useCache: false,
		} );
	},
	reducerCallback: ( state ) => {
		// Actual accounts, properties, profiles are set by resolver with
		// custom logic, hence here we just set a flag.
		return {
			...state,
			isAwaitingAccountsPropertiesProfilesCompletion: true,
		};
	},
	argsToParams: ( data ) => {
		return { data };
	},
	validateParams: ( { data } = {} ) => {
		invariant( isPlainObject( data ), 'data must be an object.' );
	},
} );

const fetchCreateAccountStore = createFetchStore( {
	baseName: 'createAccount',
	controlCallback: ( { data } ) => {
		return API.set( 'modules', 'analytics', 'create-account-ticket', data );
	},
	reducerCallback: ( state, accountTicket ) => {
		const { id } = accountTicket;
		return {
			...state,
			accountTicketID: id,
		};
	},
	argsToParams: ( data ) => {
		return { data };
	},
	validateParams: ( { data } = {} ) => {
		invariant( isPlainObject( data ), 'data must be an object.' );
	},
} );

// Actions
const RECEIVE_GET_ACCOUNTS = 'RECEIVE_GET_ACCOUNTS';
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION = 'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const BASE_INITIAL_STATE = {
	accounts: undefined,
	isAwaitingAccountsPropertiesProfilesCompletion: false,
	accountTicketID: undefined,
};

const baseActions = {
	receiveGetAccounts( accounts ) {
		invariant( Array.isArray( accounts ), 'accounts must be an array.' );

		return {
			payload: { accounts },
			type: RECEIVE_GET_ACCOUNTS,
		};
	},

	receiveAccountsPropertiesProfilesCompletion() {
		return {
			payload: {},
			type: RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION,
		};
	},

	*resetAccounts() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		return dispatch( STORE_NAME )
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
	 * @since 1.9.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*createAccount() {
		const registry = yield Data.commonActions.getRegistry();
		const { getValue } = registry.select( CORE_FORMS );

		const data = {
			accountName: getValue( FORM_ACCOUNT_CREATE, 'accountName' ),
			propertyName: getValue( FORM_ACCOUNT_CREATE, 'propertyName' ),
			profileName: getValue( FORM_ACCOUNT_CREATE, 'profileName' ),
			timezone: getValue( FORM_ACCOUNT_CREATE, 'timezone' ),
		};

		const { response, error } = yield fetchCreateAccountStore.actions.fetchCreateAccount( data );
		if ( error ) {
			// Store error manually since createAccount signature differs from fetchCreateAccount.
			yield registry.dispatch( STORE_NAME ).receiveError( error, 'createAccount', [] );
		}

		return { response, error };
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RECEIVE_GET_ACCOUNTS: {
			const { accounts } = payload;
			return {
				...state,
				accounts,
			};
		}

		case RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION: {
			return {
				...state,
				isAwaitingAccountsPropertiesProfilesCompletion: false,
			};
		}

		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: BASE_INITIAL_STATE.accounts,
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

const baseResolvers = {
	*getAccounts() {
		const registry = yield Data.commonActions.getRegistry();
		const existingAccounts = registry.select( STORE_NAME ).getAccounts();
		let matchedProperty = registry.select( STORE_NAME ).getMatchedProperty();
		// Only fetch accounts if there are none in the store.
		if ( existingAccounts === undefined ) {
			yield tagActions.waitForExistingTag();
			const existingTag = registry.select( STORE_NAME ).getExistingTag();
			let existingTagPermission;
			if ( existingTag ) {
				yield tagActions.waitForTagPermission( existingTag );
				existingTagPermission = registry.select( STORE_NAME ).getTagPermission( existingTag );
			}

			const { response, error } = yield fetchGetAccountsPropertiesProfilesStore.actions.fetchGetAccountsPropertiesProfiles( {
				existingPropertyID: existingTag,
				existingAccountID: existingTagPermission?.accountID,
			} );

			const { dispatch } = registry;
			if ( response ) {
				dispatch( STORE_NAME ).receiveGetAccounts( response.accounts );

				if ( response.properties?.[ 0 ]?.accountId ) {
					const accountID = response.properties[ 0 ].accountId;
					dispatch( STORE_NAME ).receiveGetProperties( response.properties, { accountID } );
				}

				if ( response.profiles?.[ 0 ]?.webPropertyId ) {
					const propertyID = response.profiles[ 0 ].webPropertyId;
					const accountID = response.profiles[ 0 ].accountId;
					dispatch( STORE_NAME ).receiveGetProfiles( response.profiles, { accountID, propertyID } );
				}

				if ( response.matchedProperty ) {
					dispatch( STORE_NAME ).receiveMatchedProperty( response.matchedProperty );
				}

				( { matchedProperty } = response );
			}

			if ( error ) {
				// Store error manually since getAccounts signature differs from fetchGetAccountsPropertiesProfiles.
				dispatch( STORE_NAME ).receiveError( error, 'getAccounts', [] );
			}

			dispatch( STORE_NAME ).receiveAccountsPropertiesProfilesCompletion();
		}

		const accountID = registry.select( STORE_NAME ).getAccountID();
		// Pre-select values from the matched property if no account is selected.
		if ( matchedProperty && ! accountID ) {
			registry.dispatch( STORE_NAME ).setAccountID( matchedProperty.accountId ); // Capitalization rule exception: accountId
			registry.dispatch( STORE_NAME ).selectProperty( matchedProperty.id, matchedProperty.internalWebPropertyId ); // Capitalization rule exception: internalWebPropertyId
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Analytics accounts this user can access.
	 *
	 * Returns an array of all analytics accounts.
	 *
	 * Returns `undefined` if accounts have not yet loaded.
	 *
	 * @since 1.8.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of Analytics accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since 1.8.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isDoingGetAccounts( state ) {
		// Check if dispatch calls right after fetching are still awaiting.
		if ( state.isAwaitingAccountsPropertiesProfilesCompletion ) {
			return true;
		}
		// Since isFetchingGetAccountsPropertiesProfiles (via createFetchStore)
		// holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such
		// request is in progress.
		return Object.values( state.isFetchingGetAccountsPropertiesProfiles ).some( Boolean );
	},

	/**
	 * Indicates whether account creation is currently in progress.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if an account is being created, false otherwise.
	 */
	isDoingCreateAccount( state ) {
		// Since isFetchingCreateAccount (via createFetchStore)
		// holds information based on specific values but we only need
		// generic information here, we need to check whether ANY such
		// request is in progress.
		return Object.values( state.isFetchingCreateAccount ).some( Boolean );
	},

	/**
	 * Get the terms of service URL.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The terms of service URL.
	 */
	getAccountTicketTermsOfServiceURL: createRegistrySelector( ( select ) => ( state ) => {
		const { accountTicketID } = state;
		const tosURL = select( STORE_NAME ).getServiceURL( { path: `/termsofservice/${ accountTicketID }`, query: { provisioningSignup: 'false' } } );

		if ( undefined === accountTicketID || ! tosURL ) {
			return undefined;
		}

		return tosURL;
	} ),

	/**
	 * Whether or not the account create form is valid to submit.
	 *
	 * @since 1.9.0
	 * @private
	 *
	 * @return {boolean} True if valid, otherwise false.
	 */
	canSubmitAccountCreate: createRegistrySelector( ( select ) => () => {
		const { getValue } = select( CORE_FORMS );

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'accountName' ) ) {
			return false;
		}
		if ( ! getValue( FORM_ACCOUNT_CREATE, 'propertyName' ) ) {
			return false;
		}
		if ( ! getValue( FORM_ACCOUNT_CREATE, 'profileName' ) ) {
			return false;
		}
		if ( ! getValue( FORM_ACCOUNT_CREATE, 'timezone' ) ) {
			return false;
		}
		return true;
	} ),
};

const store = Data.combineStores(
	fetchGetAccountsPropertiesProfilesStore,
	fetchCreateAccountStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
