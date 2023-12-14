/**
 * `modules/analytics-4` data store: accounts.
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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from './constants';
import {
	MODULES_ANALYTICS,
	FORM_ACCOUNT_CREATE,
	PROPERTY_TYPE_GA4,
} from '../../analytics/datastore/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

const { createRegistrySelector } = Data;
const { receiveError, clearError } = errorStoreActions;

const fetchGetAccountSummariesStore = createFetchStore( {
	baseName: 'getAccountSummaries',
	controlCallback() {
		return API.get(
			'modules',
			'analytics-4',
			'account-summaries',
			{},
			{
				useCache: false,
			}
		);
	},
	reducerCallback( state, accountSummaries ) {
		return { ...state, accountSummaries };
	},
} );

const fetchCreateAccountStore = createFetchStore( {
	baseName: 'createAccount',
	controlCallback: ( { data } ) => {
		return API.set(
			'modules',
			'analytics-4',
			'create-account-ticket',
			data
		);
	},
	// eslint-disable-next-line sitekit/acronym-case
	reducerCallback: ( state, { accountTicketId: accountTicketID } ) => {
		return {
			...state,
			accountTicketID,
		};
	},
	argsToParams: ( data ) => {
		return { data };
	},
	validateParams: ( { data } = {} ) => {
		invariant( isPlainObject( data ), 'data must be an object.' );
	},
} );

const baseInitialState = {
	accountSummaries: undefined,
	accountTicketID: undefined,
};

const baseActions = {
	/**
	 * Creates a new Analytics (GA4) account.
	 *
	 * @since 1.98.0
	 *
	 * @return {Object} Object with `response` and `error`.
	 */
	*createAccount() {
		const registry = yield Data.commonActions.getRegistry();

		const { getValue } = registry.select( CORE_FORMS );
		const data = {
			displayName: getValue( FORM_ACCOUNT_CREATE, 'accountName' ),
			propertyName: getValue( FORM_ACCOUNT_CREATE, 'propertyName' ),
			dataStreamName: getValue( FORM_ACCOUNT_CREATE, 'dataStreamName' ),
			timezone: getValue( FORM_ACCOUNT_CREATE, 'timezone' ),
			regionCode: getValue( FORM_ACCOUNT_CREATE, 'countryCode' ),
			enhancedMeasurementStreamEnabled: getValue(
				FORM_ACCOUNT_CREATE,
				ENHANCED_MEASUREMENT_ENABLED
			),
		};

		yield clearError( 'createAccount', [] );
		const { response, error } =
			yield fetchCreateAccountStore.actions.fetchCreateAccount( data );

		if ( error ) {
			yield receiveError( error, 'createAccount', [] );
		}

		return { response, error };
	},
};

const baseControls = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAccountSummaries() {
		const registry = yield Data.commonActions.getRegistry();
		const summaries = registry
			.select( MODULES_ANALYTICS_4 )
			.getAccountSummaries();
		if ( summaries === undefined ) {
			yield fetchGetAccountSummariesStore.actions.fetchGetAccountSummaries();
		}
	},
	*getAccounts() {
		const registry = yield Data.commonActions.getRegistry();
		const accountSummaries = registry
			.select( MODULES_ANALYTICS_4 )
			.getAccountSummaries();

		if ( accountSummaries === undefined ) {
			yield fetchGetAccountSummariesStore.actions.fetchGetAccountSummaries();
		}

		const accountID = registry.select( MODULES_ANALYTICS ).getAccountID();

		if ( ! accountID ) {
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
		if ( ga4PropertyID === PROPERTY_CREATE ) {
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
					.matchAndSelectProperty( accountID, PROPERTY_CREATE )
			);
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Analytics 4 account summaries with their properties.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array.<Object>|undefined} An array of account summaries; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		return state.accountSummaries;
	},

	/**
	 * Gets account summaries.
	 *
	 * @since 1.32.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array.<Object>} Account summaries array.
	 */
	getAccountSummaries( state ) {
		return state.accountSummaries;
	},

	/**
	 * Indicates whether account creation is currently in progress.
	 *
	 * @since 1.98.0
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
	 * @since 1.98.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The terms of service URL.
	 */
	getAccountTicketTermsOfServiceURL: createRegistrySelector(
		( select ) => ( state ) => {
			const { accountTicketID } = state;

			if ( accountTicketID === undefined ) {
				return undefined;
			}

			const termsOfServiceURL = select( MODULES_ANALYTICS ).getServiceURL(
				{
					path: `/termsofservice/${ accountTicketID }`,
					query: { provisioningSignup: 'false' },
				}
			);

			if ( ! termsOfServiceURL ) {
				return undefined;
			}

			return termsOfServiceURL;
		}
	),

	/**
	 * Whether or not the account create form is valid to submit.
	 *
	 * @since 1.98.0
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

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'dataStreamName' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'timezone' ) ) {
			return false;
		}

		if ( ! getValue( FORM_ACCOUNT_CREATE, 'countryCode' ) ) {
			return false;
		}

		return true;
	} ),
};

const store = Data.combineStores(
	fetchGetAccountSummariesStore,
	fetchCreateAccountStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
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
