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

// Actions
const FETCH_CLIENTS = 'FETCH_CLIENTS';
const START_FETCH_CLIENTS = 'START_FETCH_CLIENTS';
const FINISH_FETCH_CLIENTS = 'FINISH_FETCH_CLIENTS';
const CATCH_FETCH_CLIENTS = 'CATCH_FETCH_CLIENTS';

const RECEIVE_CLIENTS = 'RECEIVE_CLIENTS';
const RESET_CLIENTS = 'RESET_CLIENTS';

export const INITIAL_STATE = {
	isFetchingClients: {},
	clients: {},
};

export const actions = {
	*fetchClients( accountID ) {
		invariant( accountID, 'accountID is required.' );

		let response, error;

		yield {
			payload: { accountID },
			type: START_FETCH_CLIENTS,
		};

		try {
			response = yield {
				payload: { accountID },
				type: FETCH_CLIENTS,
			};

			yield actions.receiveClients( response, { accountID } );

			yield {
				payload: { accountID },
				type: FINISH_FETCH_CLIENTS,
			};
		} catch ( err ) {
			error = err;

			yield {
				payload: { error, accountID },
				type: CATCH_FETCH_CLIENTS,
			};
		}

		return { response, error };
	},

	receiveClients( clients, { accountID } ) {
		invariant( Array.isArray( clients ), 'clients must be an array.' );
		invariant( accountID, 'accountID is required.' );

		return {
			payload: { accountID, clients },
			type: RECEIVE_CLIENTS,
		};
	},

	*resetClients() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_CLIENTS,
		};

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getClients' );
	},
};

export const controls = {
	[ FETCH_CLIENTS ]: ( { payload: { accountID } } ) => {
		return API.get( 'modules', 'adsense', 'clients', { accountID }, {
			useCache: false,
		} );
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
			const { accountID, clients } = payload;

			return {
				...state,
				clients: {
					...state.clients,
					[ accountID ]: [ ...clients ],
				},
			};
		}

		case FINISH_FETCH_CLIENTS: {
			const { accountID } = payload;

			return {
				...state,
				isFetchingClients: {
					...state.isFetchingClients,
					[ accountID ]: false,
				},
			};
		}

		case CATCH_FETCH_CLIENTS: {
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

export const resolvers = {
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

		yield actions.fetchClients( accountID );
	},
};

export const selectors = {
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

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
