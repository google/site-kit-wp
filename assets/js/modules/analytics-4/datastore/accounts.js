/**
 * `modules/analytics-4` data store: accounts.
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetAccountsStore = createFetchStore( {
	baseName: 'getAccounts',
	controlCallback: ( { data } ) => {
		return API.get( 'modules', 'analytics-4', 'accounts', data, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, accounts ) => {
		return {
			...state,
			accounts: [ ...accounts ],
		};
	},
} );

// Actions
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const baseInitialState = {
	accounts: undefined,
};

const baseActions = {
	*resetAccounts() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		return dispatch( STORE_NAME )
			.invalidateResolutionForStoreSelector( 'getAccounts' );
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: baseInitialState.accounts,
				settings: {
					...state.settings,
					accountID: undefined,
					propertyID: undefined,
					datastreamID: undefined,
					measurementID: undefined,
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

		const accounts = registry.select( STORE_NAME ).getAccounts();
		if ( accounts ) {
			return;
		}

		yield fetchGetAccountsStore.actions.fetchGetAccounts();
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Array.<Object>|undefined)} An array of Analytics accounts; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},
};

const store = Data.combineStores(
	fetchGetAccountsStore,
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
