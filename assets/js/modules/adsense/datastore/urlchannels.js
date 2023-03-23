/**
 * `modules/adsense` data store: URL channels.
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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { actions as errorStoreActions } from '../../../googlesitekit/data/create-error-store';

const fetchGetURLChannelsStore = createFetchStore( {
	baseName: 'getURLChannels',
	controlCallback: ( { accountID, clientID } ) => {
		return API.get(
			'modules',
			'adsense',
			'urlchannels',
			{ accountID, clientID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, urlchannels, { accountID, clientID } ) => {
		return {
			...state,
			urlchannels: {
				...state.urlchannels,
				[ `${ accountID }::${ clientID }` ]: [ ...urlchannels ],
			},
		};
	},
	argsToParams: ( accountID, clientID ) => {
		return { accountID, clientID };
	},
	validateParams: ( { accountID, clientID } = {} ) => {
		invariant( accountID, 'accountID is required.' );
		invariant( clientID, 'clientID is required.' );
	},
} );

// Actions
const RESET_URLCHANNELS = 'RESET_URLCHANNELS';

const baseInitialState = {
	urlchannels: {},
};

const baseActions = {
	*resetURLChannels() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_URLCHANNELS,
		};

		yield errorStoreActions.clearErrors( 'getURLChannels' );

		return dispatch( MODULES_ADSENSE ).invalidateResolutionForStoreSelector(
			'getURLChannels'
		);
	},
};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_URLCHANNELS: {
			const { siteStatus, siteSetupComplete } = state.savedSettings || {};
			return {
				...state,
				urlchannels: initialState.urlchannels,
				settings: {
					...( state.settings || {} ),
					siteStatus,
					siteSetupComplete,
				},
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getURLChannels( accountID, clientID ) {
		if ( undefined === accountID || undefined === clientID ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();
		const existingURLChannels = registry
			.select( MODULES_ADSENSE )
			.getURLChannels( accountID, clientID );
		if ( existingURLChannels ) {
			return;
		}

		const { error } =
			yield fetchGetURLChannelsStore.actions.fetchGetURLChannels(
				accountID,
				clientID
			);
		if ( error ) {
			yield errorStoreActions.receiveError( error, 'getURLChannels', [
				accountID,
				clientID,
			] );
		}
	},
};

const baseSelectors = {
	/**
	 * Gets all Google AdSense URL channels for this account and client.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch URL channels for.
	 * @param {string} clientID  The AdSense Client ID to fetch URL channels for.
	 * @return {(Array.<Object>|undefined)} An array of AdSense URL channels; `undefined` if not loaded.
	 */
	getURLChannels( state, accountID, clientID ) {
		if ( undefined === accountID || undefined === clientID ) {
			return undefined;
		}

		return state.urlchannels[ `${ accountID }::${ clientID }` ];
	},
};

const store = Data.combineStores( fetchGetURLChannelsStore, {
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
