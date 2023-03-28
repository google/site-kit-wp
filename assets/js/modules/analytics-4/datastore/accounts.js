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
import { MODULES_ANALYTICS_4 } from './constants';
import { FORM_ACCOUNT_CREATE } from '../../analytics/datastore/constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

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

const baseInitialState = {
	accountSummaries: undefined,
};

const baseActions = {
	/**
	 * Creates a new Analytics account.
	 *
	 * @since n.e.x.t
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
};

const baseSelectors = {
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
	 * @since n.e.x.t
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
