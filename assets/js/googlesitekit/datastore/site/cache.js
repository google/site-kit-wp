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
import { setItem } from '../../../googlesitekit/api/cache';

// Actions.
const CACHE_SET_ITEM = 'CACHE_SET_ITEM';

const baseInitialState = {};

const baseActions = {
	/**
	 * Yields to setItem function which sets cached data using a key.
	 *
	 * @since n.e.x.t
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
	[ CACHE_SET_ITEM ]: async ( { payload } ) => {
		const { key, value, args } = payload;

		await setItem( key, value, args );
	},
};

const baseSelectors = {};

const store = Data.combineStores( {
	initialState: baseInitialState,
	actions: baseActions,
	controls: baseControls,
	selectors: baseSelectors,
} );

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
