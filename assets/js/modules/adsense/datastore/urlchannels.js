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
const START_FETCH_URLCHANNELS = 'START_FETCH_URLCHANNELS';
const FINISH_FETCH_URLCHANNELS = 'FINISH_FETCH_URLCHANNELS';
const CATCH_FETCH_URLCHANNELS = 'CATCH_FETCH_URLCHANNELS';

const RECEIVE_URLCHANNELS = 'RECEIVE_URLCHANNELS';
const RESET_URLCHANNELS = 'RESET_URLCHANNELS';

export const INITIAL_STATE = {
	isFetchingURLChannels: {},
	urlchannels: {},
};

export const actions = {
	*fetchURLChannels( clientID ) {
		invariant( clientID, 'clientID is required.' );

		let response, error;

		yield {
			payload: { clientID },
			type: START_FETCH_URLCHANNELS,
		};

		try {
			response = yield {
				payload: { clientID },
				type: FETCH_URLCHANNELS,
			};

			yield actions.receiveURLChannels( response, { clientID } );

			yield {
				payload: { clientID },
				type: FINISH_FETCH_URLCHANNELS,
			};
		} catch ( err ) {
			error = err;

			yield {
				payload: { error, clientID },
				type: CATCH_FETCH_URLCHANNELS,
			};
		}

		return { response, error };
	},

	receiveURLChannels( urlchannels, { clientID } ) {
		invariant( Array.isArray( urlchannels ), 'urlchannels must be an array.' );
		invariant( clientID, 'clientID is required.' );

		return {
			payload: { clientID, urlchannels },
			type: RECEIVE_URLCHANNELS,
		};
	},

	*resetURLChannels() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_URLCHANNELS,
		};

		return dispatch( STORE_NAME )
			.invalidateResolutionForStoreSelector( 'getURLChannels' );
	},
};

export const controls = {
	[ FETCH_URLCHANNELS ]: ( { payload: { clientID } } ) => {
		const accountID = parseAccountID( clientID );
		if ( undefined === accountID ) {
			// Mirror the API response that would happen for an invalid client ID.
			return new Promise( () => {
				throw {
					code: 'invalid_param',
					message: __( 'The clientID parameter is not a valid AdSense client ID.', 'google-site-kit' ),
					data: { status: 400 },
				};
			} );
		}

		return API.get( 'modules', 'adsense', 'urlchannels', { accountID, clientID }, {
			useCache: false,
		} );
	},
};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case START_FETCH_URLCHANNELS: {
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

		case FINISH_FETCH_URLCHANNELS: {
			const { clientID } = payload;

			return {
				...state,
				isFetchingURLChannels: {
					...state.isFetchingURLChannels,
					[ clientID ]: false,
				},
			};
		}

		case CATCH_FETCH_URLCHANNELS: {
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
			const {
				siteStatus,
				siteSetupComplete,
			} = state.savedSettings || {};
			return {
				...state,
				urlchannels: INITIAL_STATE.urlchannels,
				settings: {
					...( state.settings || {} ),
					siteStatus,
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
	*getURLChannels( clientID ) {
		if ( undefined === clientID ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingURLChannels = registry.select( STORE_NAME ).getURLChannels( clientID );
		if ( existingURLChannels ) {
			return;
		}

		yield actions.fetchURLChannels( clientID );
	},
};

export const selectors = {
	/**
	 * Gets all Google AdSense URL channels for this account and client.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state    Data store's state.
	 * @param {string} clientID The AdSense Client ID to fetch URL channels for.
	 * @return {(Array.<Object>|undefined)} An array of AdSense URL channels; `undefined` if not loaded.
	 */
	getURLChannels( state, clientID ) {
		if ( undefined === clientID ) {
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
