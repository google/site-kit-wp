/**
 * `modules/adsense` data store: clients.
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
import { produce } from 'immer';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	createRegistrySelector,
	commonActions,
	combineStores,
} from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { isValidAccountID } from '../util';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

// Actions
const RESET_CLIENTS = 'RESET_CLIENTS';

const fetchGetClientsStore = createFetchStore( {
	baseName: 'getClients',
	controlCallback: ( { accountID } ) => {
		return get(
			'modules',
			'adsense',
			'clients',
			{ accountID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: produce( ( draft, clients, { accountID } ) => {
		if ( Array.isArray( clients ) ) {
			draft.clients[ accountID ] = [ ...clients ];
		}
	} ),
	argsToParams: ( accountID ) => {
		return { accountID };
	},
	validateParams: ( { accountID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
	},
} );

const baseInitialState = {
	clients: {},
};

const baseActions = {
	*resetClients() {
		const { dispatch } = yield commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_CLIENTS,
		};

		yield errorStoreActions.clearErrors( 'getClients' );

		return dispatch( MODULES_ADSENSE ).invalidateResolutionForStoreSelector(
			'getClients'
		);
	},
};

const baseReducer = produce( ( draft, { type } ) => {
	switch ( type ) {
		case RESET_CLIENTS: {
			const {
				clientID,
				accountStatus,
				siteStatus,
				accountSetupComplete,
				siteSetupComplete,
			} = draft.savedSettings || {};
			draft.clients = initialState.clients;
			draft.settings = {
				...( draft.settings || {} ),
				clientID,
				accountStatus,
				siteStatus,
				accountSetupComplete,
				siteSetupComplete,
			};
			break;
		}

		default: {
			return draft;
		}
	}
} );

const baseResolvers = {
	*getClients( accountID ) {
		if ( undefined === accountID || ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const existingClients = registry
			.select( MODULES_ADSENSE )
			.getClients( accountID );

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

	/**
	 * Gets the AdSense For Content (AFC) client for the given AdSense account.
	 *
	 * @since 1.74.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch AFC client for.
	 * @return {(Object|null|undefined)} An AdSense AFC client, or `null` if none exists; `undefined` if not loaded.
	 */
	getAFCClient: createRegistrySelector(
		( select ) => ( state, accountID ) => {
			if ( undefined === accountID ) {
				return undefined;
			}

			const clients = select( MODULES_ADSENSE ).getClients( accountID );

			if ( clients === undefined ) {
				return undefined;
			}

			const afcClients = clients.filter( ( client ) => {
				return 'AFC' === client.productCode;
			} );

			if ( ! afcClients.length ) {
				return null;
			}

			// Pick the first AFC client. There should only ever be one anyway.
			return afcClients[ 0 ];
		}
	),
};

const store = combineStores( fetchGetClientsStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
