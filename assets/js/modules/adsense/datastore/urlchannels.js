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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { parseAccountID } from '../util';

// Actions
const FETCH_URLCHANNELS = 'FETCH_URLCHANNELS';
const RECEIVE_URLCHANNELS = 'RECEIVE_URLCHANNELS';
const RECEIVE_URLCHANNELS_SUCCEEDED = 'RECEIVE_URLCHANNELS_SUCCEEDED';
const RECEIVE_URLCHANNELS_FAILED = 'RECEIVE_URLCHANNELS_FAILED';
const RESET_URLCHANNELS = 'RESET_URLCHANNELS';

export const INITIAL_STATE = {
	isFetchingURLChannels: {},
	urlchannels: {},
};

export const actions = {
	fetchURLChannels( clientID ) {
		return {
			payload: { clientID },
			type: FETCH_URLCHANNELS,
		};
	},

	receiveURLChannels( { clientID, urlchannels } ) {
		invariant( Array.isArray( urlchannels ), 'urlchannels must be an array.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { clientID, urlchannels },
			type: RECEIVE_URLCHANNELS,
		};
	},

	receiveURLChannelsSucceeded( clientID ) {
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { clientID },
			type: RECEIVE_URLCHANNELS_SUCCEEDED,
		};
	},

	receiveURLChannelsFailed( { error, clientID } ) {
		invariant( error, 'error is required.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { error, clientID },
			type: RECEIVE_URLCHANNELS_FAILED,
		};
	},

	*resetURLChannels() {
		const registry = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_URLCHANNELS,
		};

		return registry.stores[ STORE_NAME ].getActions()
			.invalidateResolutionForStoreSelector( 'getURLChannels' );
	},
};

export const controls = {
	[ FETCH_URLCHANNELS ]: ( { payload: { clientID } } ) => {
		const accountID = parseAccountID( clientID );
		if ( 'undefined' === typeof accountID ) {
			// Mirror the API response that would happen for an invalid client ID.
			return new Promise( () => {
				throw {
					code: 'invalid_param',
					message: __( 'The clientID parameter is not a valid AdSense client ID.', 'google-site-kit' ),
					data: { status: 400 },
				};
			} );
		}

		return API.get( 'modules', 'adsense', 'urlchannels', {
			accountID,
			clientID,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case FETCH_URLCHANNELS: {
			const { clientID } = payload;

			return {
				...state,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ clientID ]: true,
				},
			};
		}

		case RECEIVE_URLCHANNELS: {
			const { clientID, urlchannels } = payload;

			return {
				...state,
				urlchannels: {
					...state.urlchannels,
					[ clientID ]: [ ...urlchannels ],
				},
			};
		}

		case RECEIVE_URLCHANNELS_SUCCEEDED: {
			const { clientID } = payload;

			return {
				...state,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ clientID ]: false,
				},
			};
		}

		case RECEIVE_URLCHANNELS_FAILED: {
			const { error, clientID } = payload;

			return {
				...state,
				error,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ clientID ]: false,
				},
			};
		}

		case RESET_URLCHANNELS: {
			return {
				...state,
				urlchannels: {},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
	*getURLChannels( clientID ) {
		if ( 'undefined' === typeof clientID ) {
			return;
		}

		try {
			const registry = yield Data.commonActions.getRegistry();

			const existingURLChannels = registry.select( STORE_NAME ).getURLChannels( clientID );

			// If there are already URL channels loaded in state, consider it fulfilled
			// and don't make an API request.
			if ( existingURLChannels ) {
				return;
			}

			const urlchannels = yield actions.fetchURLChannels( clientID );

			yield actions.receiveURLChannels( { clientID, urlchannels } );

			return actions.receiveURLChannelsSucceeded( clientID );
		} catch ( error ) {
			// TODO: Implement an error handler store or some kind of centralized
			// place for error dispatch...
			return actions.receiveURLChannelsFailed( { clientID, error } );
		}
	},
};

export const selectors = {
	/**
	 * Gets all Google AdSense URL channels for this account and client.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to fetch URL channels for.
	 * @return {?Array.<Object>} An array of AdSense URL channels; `undefined` if not loaded.
	 */
	getURLChannels( state, clientID ) {
		if ( 'undefined' === typeof clientID ) {
			return undefined;
		}

		const { urlchannels } = state;

		return urlchannels[ clientID ];
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
