/**
 * modules/adsense data store: clients.
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
import { STORE_NAME } from './constants';
import { isValidAccountID } from '../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

// Actions
const RESET_CLIENTS = 'RESET_CLIENTS';

const fetchGetClientsStore = createFetchStore( {
	baseName: 'getClients',
	controlCallback: ( { accountID } ) => {
		return API.get( 'modules', 'adsense', 'clients', { accountID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, clients, { accountID } ) => {
		return {
			...state,
			clients: {
				...state.clients,
				[ accountID ]: [ ...clients ],
			},
		};
	},
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

const BASE_INITIAL_STATE = {
	clients: {},
};

const baseActions = {
	*resetClients() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_CLIENTS,
		};

		yield errorStoreActions.clearErrors( 'getClients' );

		return dispatch( STORE_NAME )
			.invalidateResolutionForStoreSelector( 'getClients' );
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_CLIENTS: {
			const {
				clientID,
				accountStatus,
				siteStatus,
				accountSetupComplete,
				siteSetupComplete,
			} = state.savedSettings || {};
			return {
				...state,
				clients: INITIAL_STATE.clients,
				settings: {
					...( state.settings || {} ),
					clientID,
					accountStatus,
					siteStatus,
					accountSetupComplete,
					siteSetupComplete,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

const baseResolvers = {
	*getClients( accountID ) {
		if ( undefined === accountID || ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingClients = registry.select( STORE_NAME ).getClients( accountID );

		// If there are already clients loaded in state, consider it fulfilled
		// and don't make an API request.
		if ( existingClients ) {
			return;
		}

		yield fetchGetClientsStore.actions.fetchGetClients( accountID );
	},
};

const baseSelectors = {
	/**
	 * Gets all Google AdSense clients this account can access.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch clients for.
	 * @return {(Array.<Object>|undefined)} An array of AdSense clients; `undefined` if not loaded.
	 */
	getClients( state, accountID ) {
		if ( undefined === accountID ) {
			return undefined;
		}

		const { clients } = state;

		return clients[ accountID ];
	},
};

const store = Data.combineStores(
	fetchGetClientsStore,
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
