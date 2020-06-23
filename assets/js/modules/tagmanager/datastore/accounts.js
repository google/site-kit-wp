/**
 * modules/tagmanager data store: accounts.
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
import { STORE_NAME, ACCOUNT_CREATE } from './constants';
import { isValidAccountSelection } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
const { createRegistrySelector } = Data;

// Actions
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const fetchGetAccountsStore = createFetchStore( {
	baseName: 'getAccounts',
	controlCallback: () => API.get( 'modules', 'tagmanager', 'accounts', null, { useCache: false } ),
	reducerCallback: ( state, accounts ) => {
		return {
			...state,
			accounts,
		};
	},
} );

export const BASE_INITIAL_STATE = {
	accounts: undefined,
};

export const baseActions = {
	*resetAccounts() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		dispatch( STORE_NAME ).invalidateResolutionForStoreSelector( 'getAccounts' );
	},

	*selectAccount( accountID ) {
		invariant( isValidAccountSelection( accountID ), 'A valid accountID is required to select.' );

		const registry = yield Data.commonActions.getRegistry();
		registry.dispatch( STORE_NAME ).setAccountID( accountID );

		if ( ACCOUNT_CREATE === accountID ) {
			// eslint-disable-next-line no-useless-return
			return;
		}

		// Trigger cascading selections.
	},
};

export const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: undefined,
				settings: {
					...state.settings,
					accountID: undefined,
					ampContainerID: undefined,
					containerID: undefined,
					internalAMPContainerID: undefined,
					internalContainerID: undefined,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const baseResolvers = {
	*getAccounts() {
		const registry = yield Data.commonActions.getRegistry();
		const existingAccounts = registry.select( STORE_NAME ).getAccounts();

		// Only fetch accounts if there are none in the store.
		if ( ! existingAccounts ) {
			yield fetchGetAccountsStore.actions.fetchGetAccounts();
		}
	},
};

export const baseSelectors = {
	/**
	 * Gets all Google Tag Manager accounts this user can access.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of account objects; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isDoingGetAccounts: createRegistrySelector( ( select ) => () => {
		return select( STORE_NAME ).isFetchingGetAccounts();
	} ),
};

const store = Data.combineStores(
	fetchGetAccountsStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
