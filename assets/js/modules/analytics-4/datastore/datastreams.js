/**
 * `modules/analytics-4` data store: datastreams.
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
import { isValidPropertyID } from '../util';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const fetchGetDatastreamsStore = createFetchStore( {
	baseName: 'getDatastreams',
	controlCallback: ( { propertyID } ) => {
		return API.get( 'modules', 'analytics-4', 'datastreams', { propertyID }, {
			useCache: false,
		} );
	},
	reducerCallback: ( state, datastreams, { propertyID } ) => {
		return {
			...state,
			datastreams: {
				...state.datastreams,
				[ propertyID ]: [ ...datastreams ],
			},
		};
	},
	argsToParams: ( propertyID ) => {
		return { propertyID };
	},
	validateParams: ( { propertyID } = {} ) => {
		invariant( isValidPropertyID( propertyID ), 'a valid property ID is required to fetch datastreams for.' );
	},
} );

const baseInitialState = {
	datastreams: {},
};

const baseResolvers = {
	*getDatastreams( propertyID ) {
		if ( ! isValidPropertyID( propertyID ) ) {
			return;
		}

		const registry = yield Data.commonActions.getRegistry();

		const datastreams = registry.select( STORE_NAME ).getDatastreams( propertyID );
		if ( datastreams ) {
			return;
		}

		yield fetchGetDatastreamsStore.actions.fetchGetDatastreams( propertyID );
	},
};

const baseSelectors = {
	/**
	 * Gets all Google Analytics datastreams this user property has available.
	 *
	 * Returns an array of all datastreams.
	 *
	 * Returns `undefined` if datastreams have not yet loaded.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state      Data store's state.
	 * @param {string} propertyID The Analytics Property ID to fetch datastreams for.
	 * @return {(Array.<Object>|undefined)} An array of Analytics datastreams; `undefined` if not loaded.
	 */
	getDatastreams( state, propertyID ) {
		const { datastreams } = state;
		return datastreams[ propertyID ];
	},
};

const store = Data.combineStores(
	fetchGetDatastreamsStore,
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
