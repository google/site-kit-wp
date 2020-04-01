/**
 * modules/adsense data store: URL channels.
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
import { STORE_NAME } from './index';

// Actions
const FETCH_URLCHANNELS = 'FETCH_URLCHANNELS';
const RECEIVE_URLCHANNELS = 'RECEIVE_URLCHANNELS';
const RECEIVE_URLCHANNELS_SUCCEEDED = 'RECEIVE_URLCHANNELS_SUCCEEDED';
const RECEIVE_URLCHANNELS_FAILED = 'RECEIVE_URLCHANNELS_FAILED';

export const INITIAL_STATE = {
	isFetchingURLChannels: {},
	urlchannels: {},
};

export const actions = {
	fetchURLChannels( accountID, clientID ) {
		return {
			payload: { accountID, clientID },
			type: FETCH_URLCHANNELS,
		};
	},

	receiveURLChannels( { accountID, clientID, urlchannels } ) {
		invariant( Array.isArray( urlchannels ), 'urlchannels must be an array.' );
		invariant( accountID, 'accountID is required.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { accountID, clientID, urlchannels },
			type: RECEIVE_URLCHANNELS,
		};
	},

	receiveURLChannelsSucceeded( accountID, clientID ) {
		invariant( accountID, 'accountID is required.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { accountID, clientID },
			type: RECEIVE_URLCHANNELS_SUCCEEDED,
		};
	},

	receiveURLChannelsFailed( { accountID, error, clientID } ) {
		invariant( accountID, 'accountID is required.' );
		invariant( error, 'error is required.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { accountID, error, clientID },
			type: RECEIVE_URLCHANNELS_FAILED,
		};
	},
};

export const controls = {
	[ FETCH_URLCHANNELS ]: ( { payload: { accountID, clientID } } ) => {
		return API.get( 'modules', 'adsense', 'urlchannels', {
			accountID,
			clientID,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_URLCHANNELS: {
			const { accountID, clientID } = payload;

			return {
				...state,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ `${ accountID }::${ clientID }` ]: true,
				},
			};
		}

		case RECEIVE_URLCHANNELS: {
			const { accountID, clientID, urlchannels } = payload;

			return {
				...state,
				urlchannels: {
					...state.urlchannels,
					[ `${ accountID }::${ clientID }` ]: [ ...urlchannels ],
				},
			};
		}

		case RECEIVE_URLCHANNELS_SUCCEEDED: {
			const { accountID, clientID } = payload;

			return {
				...state,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ `${ accountID }::${ clientID }` ]: false,
				},
			};
		}

		case RECEIVE_URLCHANNELS_FAILED: {
			const { accountID, error, clientID } = payload;

			return {
				...state,
				error,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ `${ accountID }::${ clientID }` ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getURLChannels( accountID, clientID ) {
		try {
			const registry = yield Data.commonActions.getRegistry();

			const existingURLChannels = registry.select( STORE_NAME ).getURLChannels( accountID, clientID );

			// If there are already URL channels loaded in state, consider it fulfilled
			// and don't make an API request.
			if ( existingURLChannels ) {
				return;
			}

			const urlchannels = yield actions.fetchURLChannels( accountID, clientID );

			yield actions.receiveURLChannels( { accountID, clientID, urlchannels } );

			return actions.receiveURLChannelsSucceeded( accountID, clientID );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveURLChannelsFailed( { accountID, clientID, error } );
		}
	},
};

export const selectors = {
	/**
	 * Gets all Google AdSense URL channels for this account and client.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch URL channels for.
	 * @param {string} clientID  The AdSense Client ID to fetch URL channels for.
	 * @return {?Array.<Object>} An array of AdSense URL channels; `undefined` if not loaded.
	 */
	getURLChannels( state, accountID, clientID ) {
		invariant( accountID, 'accountID is required.' );
		invariant( clientID, 'clientID is required.' );

		const { urlchannels } = state;

		return urlchannels[ `${ accountID }::${ clientID }` ];
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
