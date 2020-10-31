/**
 * `modules/analytics-4` data store: properties.
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
import { isValidAccountID } from '../util';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetPropertiesStore = createFetchStore( {
	baseName: 'getProperties',
	controlCallback: ( { accountID } ) => {
		return API.get( 'modules', 'analytics-4', 'properties', { accountID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, properties, { accountID } ) => {
		return {
			...state,
			properties: {
				...state.properties,
				[ accountID ]: [ ...properties ],
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

const baseInitialState = {
	properties: {},
};

const baseResolvers = {
	*getProperties( accountID ) {
		if ( ! isValidAccountID( accountID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		const properties = registry.select( STORE_NAME ).getProperties( accountID );
		if ( properties ) {
			return;
		}

		yield fetchGetPropertiesStore.actions.fetchGetProperties( accountID );
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Analytics properties this account can access.
	 *
	 * Returns an array of all analytics properties.
	 *
	 * Returns `undefined` if properties have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     Data store's state.
	 * @param {string} accountID The Analytics Account ID to fetch properties for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics properties; `undefined` if not loaded.
	 */
	getProperties( state, accountID ) {
		const { properties } = state;

		return properties[ accountID ];
	},
};

const store = Data.combineStores(
	fetchGetPropertiesStore,
	{
		initialState: baseInitialState,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
