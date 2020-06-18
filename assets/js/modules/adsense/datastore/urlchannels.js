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
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetURLChannelsStore = createFetchStore( {
	baseName: 'getURLChannels',
	controlCallback: ( { clientID } ) => {
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
	reducerCallback: ( state, urlchannels, { clientID } ) => {
		return {
			...state,
			urlchannels: {
				...state.urlchannels,
				[ clientID ]: [ ...urlchannels ],
			},
		};
	},
	argsToParams: ( clientID ) => {
		invariant( clientID, 'clientID is required.' );
		return { clientID };
	},
} );

// Actions
const RESET_URLCHANNELS = 'RESET_URLCHANNELS';

const BASE_INITIAL_STATE = {
	urlchannels: {},
};

const baseActions = {
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

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
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

const baseResolvers = {
	*getURLChannels( clientID ) {
		if ( undefined === clientID ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingURLChannels = registry.select( STORE_NAME ).getURLChannels( clientID );
		if ( existingURLChannels ) {
			return;
		}

		yield fetchGetURLChannelsStore.actions.fetchGetURLChannels( clientID );
	},
};

const baseSelectors = {
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

const store = Data.combineStores(
	fetchGetURLChannelsStore,
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
