/**
 * `modules/adsense` data store: Ad Units.
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
import { get } from 'googlesitekit-api';
import { commonActions, combineStores } from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetAdUnitsStore = createFetchStore( {
	baseName: 'getAdUnits',
	controlCallback: ( { accountID, clientID } ) => {
		return get(
			'modules',
			'adsense',
			'adunits',
			{ accountID, clientID },
			{
				useCache: false,
			}
		);
	},
	reducerCallback: ( state, adunits, { accountID, clientID } ) => {
		return {
			...state,
			adunits: {
				...state.adunits,
				[ `${ accountID }::${ clientID }` ]: adunits,
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

const baseInitialState = {
	adunits: {},
};

const baseActions = {};

const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		default: {
			return state;
		}
	}
};

const baseResolvers = {
	*getAdUnits( accountID, clientID ) {
		if ( undefined === accountID || undefined === clientID ) {
			return;
		}

		const registry = yield commonActions.getRegistry();
		const existingAdUnits = registry
			.select( MODULES_ADSENSE )
			.getAdUnits( accountID, clientID );
		if ( existingAdUnits ) {
			return;
		}

		yield fetchGetAdUnitsStore.actions.fetchGetAdUnits(
			accountID,
			clientID
		);
	},
};

const baseSelectors = {
	/**
	 * Gets all Google AdSense Account Ad Units for this account and client.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The AdSense Account ID to fetch URL channels for.
	 * @param {string} clientID  The AdSense Client ID to fetch URL channels for.
	 * @return {(Array.<Object>|undefined)} An array of AdSense URL channels; `undefined` if not loaded.
	 */
	getAdUnits( state, accountID, clientID ) {
		if ( undefined === accountID || undefined === clientID ) {
			return undefined;
		}

		return state.adunits[ `${ accountID }::${ clientID }` ];
	},
};

const store = combineStores( fetchGetAdUnitsStore, {
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
