/**
 * `core/site` data store: client side cache.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import Data from 'googlesitekit-data';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { CORE_SITE } from './constants';

const { createReducer } = Data;

// Actions.
const CACHE_GET_ITEM = 'CACHE_GET_ITEM';
const CACHE_GET_ITEM_SAVE_TO_STORE = 'CACHE_GET_ITEM_SAVE_TO_STORE';
const CACHE_SET_ITEM = 'CACHE_SET_ITEM';

const baseInitialState = {
	getItemCacheResults: {},
};

const baseActions = {
	/**
	 * Yields to cache `getItem` which fetches cached data using a key.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} key Name of cache key.
	 * @return {Object} Redux-style action.
	 */
	*getCacheItem( key ) {
		invariant( key, 'key is required' );

		const result = yield {
			type: CACHE_GET_ITEM,
			payload: {
				key,
			},
		};

		return {
			type: CACHE_GET_ITEM_SAVE_TO_STORE,
			payload: {
				key,
				result,
			},
		};
	},
	/**
	 * Yields to setItem function which sets cached data using a key.
	 *
	 * @since 1.109.0
	 * @see setItem
	 *
	 * @param {string}  key              Name of cache key.
	 * @param {*}       value            Value to store in the cache.
	 * @param {Object}  args             Optional object containing ttl, timestamp and isError keys.
	 * @param {number}  [args.ttl]       Optional. Validity of the cached item in seconds.
	 * @param {number}  [args.timestamp] Optional. Timestamp when the cached item was created.
	 * @param {boolean} [args.isError]   Optional. Whether the cached item is an error.
	 */
	*setCacheItem( key, value, args ) {
		invariant( key, 'key is required' );

		invariant( value !== undefined, 'value is required' );

		yield {
			type: CACHE_SET_ITEM,
			payload: {
				key,
				value,
				args,
			},
		};
	},
};

// Base Controls
export const baseControls = {
	[ CACHE_GET_ITEM ]: async ( { payload } ) => {
		const { key } = payload;

		const result = await getItem( key );

		return result;
	},
	[ CACHE_SET_ITEM ]: async ( { payload } ) => {
		const { key, value, args } = payload;

		await setItem( key, value, args );
	},
};

export const baseReducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case CACHE_GET_ITEM_SAVE_TO_STORE: {
			const { key, result } = payload;

			state.getItemCacheResults[ key ] = result;

			return state;
		}

		default: {
			return state;
		}
	}
} );

const baseResolvers = {
	*getCacheItem( key ) {
		const registry = yield Data.commonActions.getRegistry();

		yield registry.dispatch( CORE_SITE ).getCacheItem( key );
	},
};

const baseSelectors = {
	/**
	 * Returns a cached item from the cache.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} key   Cache key to get cached data for.
	 * @return {Object|undefined} The returned value from `getItem` function. `undefined` while loading.
	 */
	getCacheItem: ( state, key ) => {
		return state.getItemCacheResults[ key ];
	},
};

const store = Data.combineStores( {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	resolvers: baseResolvers,
	reducer: baseReducer,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
