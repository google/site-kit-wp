/**
 * `modules/analytics` data store: accounts.
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { isValidAccountSelection } from '../util';
import { isFeatureEnabled } from '../../../features';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_ANALYTICS,
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	FORM_ACCOUNT_CREATE,
	PROPERTY_TYPE_UA,
	PROPERTY_TYPE_GA4,
} from './constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE as GA4_PROPERTY_CREATE,
} from '../../analytics-4/datastore/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';
import { actions as propertyActions } from './properties';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
const { createRegistrySelector } = Data;
const { receiveError, clearError, clearErrors } = errorStoreActions;

const fetchGetAccountsPropertiesProfilesStore = createFetchStore( {
	baseName: 'getAccountsPropertiesProfiles',
	controlCallback: () => {
		return API.get(
			'modules',
			'analytics',
			'accounts-properties-profiles',
			null,
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state ) => {
		// Actual accounts, properties, profiles are set by resolver with
		// custom logic, hence here we just set a flag.
		return {
			...state,
			isAwaitingAccountsPropertiesProfilesCompletion: true,
		};
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
const RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION =
	'RECEIVE_ACCOUNTS_PROPERTIES_PROFILES_COMPLETION';
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';
const START_SELECTING_ACCOUNT = 'START_SELECTING_ACCOUNT';
const FINISH_SELECTING_ACCOUNT = 'FINISH_SELECTING_ACCOUNT';
const RESET_PROPERTY_AND_PROFILE_IDS = 'RESET_PROPERTY_AND_PROFILE_IDS';
const REVERT_PROPERTY_AND_PROFILE_IDS = 'REVERT_PROPERTY_AND_PROFILE_IDS';

const baseInitialState = {
	accounts: undefined,
	isAwaitingAccountsPropertiesProfilesCompletion: false,
	accountTicketID: undefined,
	finishedSelectingAccount: undefined,
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

		return dispatch(
			MODULES_ANALYTICS
		).invalidateResolutionForStoreSelector( 'getAccounts' );
	},

	resetPropertyAndProfileIDs() {
		return {
			payload: {},
			type: RESET_PROPERTY_AND_PROFILE_IDS,
		};
	},

	revertPropertyAndProfileIDs() {
		return {
			payload: {},
			type: REVERT_PROPERTY_AND_PROFILE_IDS,
		};
	},

	selectAccount: createValidatedAction(
		( accountID ) => {
			invariant(
				isValidAccountSelection( accountID ),
				'A valid accountID is required to select.'
			);
		},
		function* ( accountID ) {
			const registry = yield Data.commonActions.getRegistry();
			const finishSelectingAccountAction = {
				type: FINISH_SELECTING_ACCOUNT,
				payload: {},
			};

			yield {
				type: START_SELECTING_ACCOUNT,
				payload: {},
			};

			yield clearErrors();

			registry.dispatch( MODULES_ANALYTICS ).setSettings( {
				accountID,
				internalWebPropertyID: '',
				propertyID: '',
				profileID: '',
			} );

			if ( ACCOUNT_CREATE === accountID ) {
				yield finishSelectingAccountAction;
				return;
			}

			let uaProperty = yield propertyActions.findMatchedProperty(
				accountID
			);
			const uaPropertyID = uaProperty?.id;

			if ( ! uaProperty ) {
				const uaProperties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );
				uaProperty = {
					id: uaProperties.length === 0 ? PROPERTY_CREATE : '', // Create a new property only if the selected account has no UA properties.
					internalWebPropertyId: '', // eslint-disable-line sitekit/acronym-case
				};
			}

			if ( uaProperty?.id && ! isFeatureEnabled( 'ga4Reporting' ) ) {
				yield propertyActions.selectProperty(
					uaProperty?.id,
					// eslint-disable-next-line sitekit/acronym-case
					uaProperty?.internalWebPropertyId
				);
			} else {
				registry.dispatch( MODULES_ANALYTICS ).setPropertyID( '' );
				registry.dispatch( MODULES_ANALYTICS ).setProfileID( '' );
			}

			if ( ! registry.select( MODULES_ANALYTICS ).canUseGA4Controls() ) {
				yield finishSelectingAccountAction;
				return;
			}

			registry
				.dispatch( MODULES_ANALYTICS )
				.setPrimaryPropertyType( PROPERTY_TYPE_UA );

			const ga4MatchProperty = registry
				.dispatch( MODULES_ANALYTICS_4 )
				.matchAndSelectProperty( accountID, GA4_PROPERTY_CREATE );
			const ga4Property = yield Data.commonActions.await(
				ga4MatchProperty
			);
			const ga4PropertyID = ga4Property?._id;

			if ( !! ga4PropertyID && ! uaPropertyID ) {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setPrimaryPropertyType( PROPERTY_TYPE_GA4 );
			}

			yield finishSelectingAccountAction;
		}
	),

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

		yield clearError( 'createAccount', [] );
		const { response, error } =
			yield fetchCreateAccountStore.actions.fetchCreateAccount( data );
		if ( error ) {
			// Store error manually since createAccount signature differs from fetchCreateAccount.
			yield receiveError( error, 'createAccount', [] );
		}

		return { response, error };
	},
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_SELECTING_ACCOUNT: {
			return {
				...state,
				finishedSelectingAccount: false,
			};
		}

		case FINISH_SELECTING_ACCOUNT: {
			return {
				...state,
				finishedSelectingAccount: true,
			};
		}

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
				accounts: baseInitialState.accounts,
				settings: {
					...state.settings,
					accountID: undefined,
					propertyID: undefined,
					internalWebPropertyID: undefined,
					profileID: undefined,
				},
			};
		}

		case RESET_PROPERTY_AND_PROFILE_IDS: {
			return {
				...state,
				settings: {
					...state.settings,
					propertyID: '',
					internalWebPropertyID: '',
					profileID: '',
					useSnippet: false,
				},
			};
		}

		case REVERT_PROPERTY_AND_PROFILE_IDS: {
			return {
				...state,
				settings: {
					...state.settings,
					propertyID: state.savedSettings.propertyID,
					internalWebPropertyID:
						state.savedSettings.internalWebPropertyID,
					profileID: state.savedSettings.profileID,
					useSnippet: state.savedSettings.useSnippet,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAccounts() {
		const registry = yield Data.commonActions.getRegistry();
		yield clearError( 'getAccounts', [] );

		const existingAccounts = registry
			.select( MODULES_ANALYTICS )
			.getAccounts();
		let matchedProperty = registry
			.select( MODULES_ANALYTICS )
			.getMatchedProperty();
		// Only fetch accounts if there are none in the store.
		if ( existingAccounts === undefined ) {
			const { response, error } =
				yield fetchGetAccountsPropertiesProfilesStore.actions.fetchGetAccountsPropertiesProfiles();

			const { dispatch } = registry;
			if ( response ) {
				dispatch( MODULES_ANALYTICS ).receiveGetAccounts(
					response.accounts
				);

				// eslint-disable-next-line sitekit/acronym-case
				if ( response.properties?.[ 0 ]?.accountId ) {
					const accountID = response.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
					dispatch( MODULES_ANALYTICS ).receiveGetProperties(
						response.properties,
						{
							accountID,
						}
					);
				}

				// eslint-disable-next-line sitekit/acronym-case
				if ( response.profiles?.[ 0 ]?.webPropertyId ) {
					const propertyID = response.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case
					const accountID = response.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
					dispatch( MODULES_ANALYTICS ).receiveGetProfiles(
						response.profiles,
						{
							accountID,
							propertyID,
						}
					);
				}

				if ( response.matchedProperty ) {
					dispatch( MODULES_ANALYTICS ).receiveMatchedProperty(
						response.matchedProperty
					);
				}

				( { matchedProperty } = response );
			}

			if ( error ) {
				// Store error manually since getAccounts signature differs from fetchGetAccountsPropertiesProfiles.
				yield receiveError( error, 'getAccounts', [] );
			}

			dispatch(
				MODULES_ANALYTICS
			).receiveAccountsPropertiesProfilesCompletion();
		}

		let accountID = registry.select( MODULES_ANALYTICS ).getAccountID();
		// Pre-select values from the matched property if no account is selected.
		if ( matchedProperty && ! accountID ) {
			/* eslint-disable sitekit/acronym-case */
			accountID = matchedProperty.accountId;
			registry
				.dispatch( MODULES_ANALYTICS )
				.setAccountID( matchedProperty.accountId );

			if ( ! isFeatureEnabled( 'ga4Reporting' ) ) {
				yield propertyActions.selectProperty(
					matchedProperty.id,
					matchedProperty.internalWebPropertyId
				);
			}
			/* eslint-enable */
		}

		// Do not try to find a matching GA4 property if the module has already been connected.
		const connected = registry
			.select( CORE_MODULES )
			.isModuleConnected( 'analytics' );
		if ( connected ) {
			return;
		}

		// If there are no matching UA property and no accountID, we need to try to find matching GA4 property.
		if ( ! matchedProperty && ! accountID ) {
			const matchedGA4Property = yield Data.commonActions.await(
				registry.dispatch( MODULES_ANALYTICS_4 ).findMatchedProperty()
			);
			if ( matchedGA4Property?._accountID ) {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( matchedGA4Property?._accountID );
				registry
					.dispatch( MODULES_ANALYTICS )
					.setPrimaryPropertyType( PROPERTY_TYPE_GA4 );

				yield Data.commonActions.await(
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.selectProperty( matchedGA4Property._id )
				);

				return;
			}
		}

		let ga4Property;
		const ga4PropertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();

		// Bail out if the analytics-4 propertyID is already set to create a new property.
		if ( ga4PropertyID === GA4_PROPERTY_CREATE ) {
			return;
		}

		if ( ga4PropertyID ) {
			ga4Property = yield Data.commonActions.await(
				registry
					.__experimentalResolveSelect( MODULES_ANALYTICS_4 )
					.getProperty( ga4PropertyID )
			);
		}

		// Try to find a new matched ga4 property if the current one has a different accountID.
		if ( accountID && ga4Property?._accountID !== accountID ) {
			yield Data.commonActions.await(
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID, GA4_PROPERTY_CREATE )
			);
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
		return Object.values(
			state.isFetchingGetAccountsPropertiesProfiles
		).some( Boolean );
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
	getAccountTicketTermsOfServiceURL: createRegistrySelector(
		( select ) => ( state ) => {
			const { accountTicketID } = state;
			const tosURL = select( MODULES_ANALYTICS ).getServiceURL( {
				path: `/termsofservice/${ accountTicketID }`,
				query: { provisioningSignup: 'false' },
			} );

			if ( undefined === accountTicketID || ! tosURL ) {
				return undefined;
			}

			return tosURL;
		}
	),

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

	/**
	 * Determines whether the account selection process has finished or not.
	 *
	 * @since 1.46.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} TRUE if the account selection process has finished, otherwise FALSE.
	 */
	hasFinishedSelectingAccount( state ) {
		return state.finishedSelectingAccount;
	},
};

const store = Data.combineStores(
	fetchGetAccountsPropertiesProfilesStore,
	fetchCreateAccountStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
