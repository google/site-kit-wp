/**
 * Data API - Cache related
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { cloneDeep } from 'lodash';
/**
 * Internal dependencies
 */
import { getStorage } from '../../util/storage';

/**
 * Ensures that the local datacache object is properly set up.
 */
export const lazilySetupLocalCache = () => {
	global.googlesitekit.admin = global.googlesitekit.admin || {};

	if ( 'string' === typeof global.googlesitekit.admin.datacache ) {
		global.googlesitekit.admin.datacache = JSON.parse( global.googlesitekit.admin.datacache );
	}

	if ( 'object' !== typeof global.googlesitekit.admin.datacache ) {
		global.googlesitekit.admin.datacache = {};
	}
};

/**
 * Sets data in the cache.
 *
 * @param {string} key  The cache key.
 * @param {Object} data The data to cache.
 */
export const setCache = ( key, data ) => {
	if ( 'undefined' === typeof data ) {
		return;
	}

	// Specific workaround to ensure no error responses are cached.
	if ( data && 'object' === typeof data && ( data.error || data.errors ) ) {
		return;
	}

	lazilySetupLocalCache();

	global.googlesitekit.admin.datacache[ key ] = cloneDeep( data );

	const toStore = {
		value: data,
		date: Date.now() / 1000,
	};
	getStorage().setItem( 'googlesitekit_' + key, JSON.stringify( toStore ) );
};

/**
 * Gets data from the cache.
 *
 * @param {string} key    The cache key.
 * @param {number} maxAge The cache TTL in seconds. If not provided, no TTL will be checked.
 *
 * @return {(Object|undefined)} Cached data, or undefined if lookup failed.
 */
export const getCache = ( key, maxAge ) => {
	// Skip if js caching is disabled.
	if ( global.googlesitekit.admin.nojscache ) {
		return undefined;
	}

	lazilySetupLocalCache();

	// Check variable cache first.
	if ( 'undefined' !== typeof global.googlesitekit.admin.datacache[ key ] ) {
		return global.googlesitekit.admin.datacache[ key ];
	}

	// Check persistent cache.
	const cache = JSON.parse( getStorage().getItem( 'googlesitekit_' + key ) );
	if ( cache && 'object' === typeof cache && cache.date ) {
		// Only return value if no maximum age given or if cache age is less than the maximum.
		if ( ! maxAge || ( Date.now() / 1000 ) - cache.date < maxAge ) {
			// Set variable cache.
			global.googlesitekit.admin.datacache[ key ] = cloneDeep( cache.value );

			return cloneDeep( global.googlesitekit.admin.datacache[ key ] );
		}
	}

	return undefined;
};

/**
 * Removes data from the cache.
 *
 * @param {string} key The cache key.
 */
export const deleteCache = ( key ) => {
	lazilySetupLocalCache();

	delete global.googlesitekit.admin.datacache[ key ];

	getStorage().removeItem( 'googlesitekit_' + key );
};
