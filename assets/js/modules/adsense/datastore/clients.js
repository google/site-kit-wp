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
import { groupBy } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './index';
import { isValidAccountID, parseAccountID } from '../util';

// Actions
const FETCH_CLIENTS = 'FETCH_CLIENTS';
const RECEIVE_CLIENTS = 'RECEIVE_CLIENTS';
const RECEIVE_CLIENTS_SUCCEEDED = 'RECEIVE_CLIENTS_SUCCEEDED';
const RECEIVE_CLIENTS_FAILED = 'RECEIVE_CLIENTS_FAILED';

export const INITIAL_STATE = {
	isFetchingClients: {},
	clients: {},
};

export const actions = {
	fetchClients( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
			type: FETCH_CLIENTS,
		};
	},

	/**
	 * Adds clients to the store.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Array} clients Clients to add.
	 * @return {Object} Redux-style action.
	 */
	receiveClients( clients ) {
		invariant( Array.isArray( clients ), 'clients must be an array.' );

		return {
			payload: { clients },
			type: RECEIVE_CLIENTS,
		};
	},

	receiveClientsSucceeded( accountID ) {
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID },
			type: RECEIVE_CLIENTS_SUCCEEDED,
		};
	},

	receiveClientsFailed( { accountID, error } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( error, 'error is required.' );

		return {
			payload: { accountID, error },
			type: RECEIVE_CLIENTS_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_CLIENTS ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'adsense', 'clients', { accountID } );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_CLIENTS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingClients: {
					...state.isFetchingClients,
					[ accountID ]: true,
				},
			};
		}

		case RECEIVE_CLIENTS: {
			const { clients } = payload;

			return {
				...state,
				clients: {
					...state.clients,
					...groupBy( clients, ( client ) => parseAccountID( client.id ) ),
				},
			};
		}

		case RECEIVE_CLIENTS_SUCCEEDED: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingClients: {
					...state.isFetchingClients,
					[ accountID ]: false,
				},
			};
		}

		case RECEIVE_CLIENTS_FAILED: {
			const { accountID, error } = payload;

			return {
				...state,
				error,
				isFetchingClients: {
					...state.isFetchingClients,
					[ accountID ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getClients( accountID ) {
		if ( 'undefined' === typeof accountID || ! isValidAccountID( accountID ) ) {
			return undefined;
		}
		try {
			const registry = yield Data.commonActions.getRegistry();
			const existingClients = registry.select( STORE_NAME ).getClients( accountID );

			// If there are already clients loaded in state, consider it fulfilled
			// and don't make an API request.
			if ( existingClients ) {
				return;
			}

			const clients = yield actions.fetchClients( accountID );

			yield actions.receiveClients( clients );

			return yield actions.receiveClientsSucceeded( accountID );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveClientsFailed( { accountID, error } );
		}
	},
};

export const selectors = {
	/**
	 * Gets all Google AdSense clients this account can access.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch clients for.
	 * @return {?Array.<Object>} An array of AdSense clients; `undefined` if not loaded.
	 */
	getClients( state, accountID ) {
		if ( 'undefined' === typeof accountID ) {
			return undefined;
		}

		const { clients } = state;

		return clients[ accountID ];
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
