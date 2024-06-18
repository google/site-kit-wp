/**
 * Caching functions and cache management for API requests.
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
 * Internal dependencies
 */
import { HOUR_IN_SECONDS } from '../../util';

/**
 * Prefix used for all Site Kit keys.
 *
 * Anything not using this prefix should not be touched by this library.
 *
 * @since 1.96.0
 * @private
 */
export const STORAGE_KEY_PREFIX_ROOT = 'googlesitekit_';

/**
 * Prefix used for all Site Kit keys for the current Site Kit version.
 *
 * Anything not using this key should not be touched by this library.
 *
 * @since 1.5.0
 * @since 1.92.0 Updated to include a user, session, and blog-specific hash.
 * @since 1.96.0 Updated to make use of the new STORAGE_KEY_PREFIX_ROOT constant.
 * @private
 */
export const STORAGE_KEY_PREFIX = `${ STORAGE_KEY_PREFIX_ROOT }${ global.GOOGLESITEKIT_VERSION }_${ global._googlesitekitBaseData.storagePrefix }_`;

const defaultOrder = [ 'sessionStorage', 'localStorage' ];
let storageBackend;
let storageOrder = [ ...defaultOrder ];

/**
 * Overrides the storage backend.
 *
 * Largely used for tests. Should not be used directly.
 *
 * @since 1.5.0
 * @private
 *
 * @param {*} backend Backend to set for the cache.
 */
export const setSelectedStorageBackend = ( backend ) => {
	storageBackend = backend;
};

/**
 * Overrides the priority of storage mechanisms.
 *
 * Largely used for tests. Implicitly resets the selected storage backend,
 * causing `_getStorage` to re-run its checks for the best available
 * storage backend.
 *
 * @since 1.5.0
 * @private
 *
 * @param {Array} order Ordered array of storage backends to use.
 */
export const setStorageOrder = ( order ) => {
	storageOrder = [ ...order ];
	setSelectedStorageBackend( undefined );
};

/**
 * Resets the storage mechanism order.
 *
 * Largely used for tests. Implicitly resets the selected storage backend,
 * causing `_getStorage` to re-run its checks for the best available
 * storage backend.
 *
 * @since 1.5.0
 * @private
 */
export const resetDefaultStorageOrder = () => {
	storageOrder = [ ...defaultOrder ];
	setSelectedStorageBackend( undefined );
};

/**
 * Detects whether browser storage is both supported and available.
 *
 * @since 1.5.0
 * @private
 *
 * @param {string} type Browser storage to test. Should be one of `localStorage` or `sessionStorage`.
 * @return {boolean} True if the given storage is available, false otherwise.
 */
// eslint-disable-next-line require-await
export const isStorageAvailable = async ( type ) => {
	const storage = global[ type ];

	if ( ! storage ) {
		return false;
	}

	try {
		const x = '__storage_test__';

		storage.setItem( x, x );
		storage.removeItem( x );
		return true;
	} catch ( e ) {
		return (
			e instanceof DOMException &&
			// everything except Firefox
			( 22 === e.code ||
				// Firefox
				1014 === e.code ||
				// test name field too, because code might not be present
				// everything except Firefox
				'QuotaExceededError' === e.name ||
				// Firefox
				'NS_ERROR_DOM_QUOTA_REACHED' === e.name ) &&
			// acknowledge QuotaExceededError only if there's something already stored
			0 !== storage.length
		);
	}
};

/**
 * Gets the storage object to use.
 *
 * @since 1.5.0
 * @private
 *
 * @return {Storage|null} A storage mechanism (`localStorage` or `sessionStorage`) if available; otherwise returns `null`.
 */
export async function getStorage() {
	if ( storageBackend !== undefined ) {
		return storageBackend;
	}

	// Only run the logic to determine the storage object once.
	for ( const backend of storageOrder ) {
		if ( storageBackend ) {
			continue;
		}

		if ( await isStorageAvailable( backend ) ) {
			storageBackend = global[ backend ];
		}
	}

	if ( storageBackend === undefined ) {
		storageBackend = null;
	}

	return storageBackend;
}

/**
 * Gets cached data.
 *
 * Get cached data from the persistent storage cache.
 *
 * @since 1.5.0
 *
 * @param {string} key Name of cache key.
 * @return {Promise} A promise returned, containing an object with the cached value (if found) and whether or not there was a cache hit.
 */
export const getItem = async ( key ) => {
	const storage = await getStorage();

	if ( storage ) {
		const cachedData = storage.getItem( `${ STORAGE_KEY_PREFIX }${ key }` );

		if ( cachedData ) {
			const parsedData = JSON.parse( cachedData );
			const { timestamp, ttl, value, isError } = parsedData;

			// Ensure a timestamp is found, otherwise this isn't a valid cache hit.
			// (We don't check for a truthy `value`, because it could be legitimately
			// false-y if `0`, `null`, etc.)
			if (
				timestamp &&
				( ! ttl || // Ensure the cached data isn't too old.
					// Don't use the getReferenceDate selector here since there is no need in it.
					Math.round( Date.now() / 1000 ) - timestamp < ttl ) // eslint-disable-line sitekit/no-direct-date
			) {
				return {
					cacheHit: true,
					value,
					isError,
				};
			}
		}
	}

	return {
		cacheHit: false,
		value: undefined,
	};
};

/**
 * Sets cached data using a key.
 *
 * Save data to the relevant local storage mechanism, if available.
 * By default, data is saved with a one hour (60 minute) TTL.
 *
 * @since 1.5.0
 *
 * @param {string}  key              Name of cache key.
 * @param {*}       value            Value to store in the cache.
 * @param {Object}  args             Optional object containing ttl, timestamp and isError keys.
 * @param {number}  [args.ttl]       Optional. Validity of the cached item in seconds.
 * @param {number}  [args.timestamp] Optional. Timestamp when the cached item was created.
 * @param {boolean} [args.isError]   Optional. Whether the cached item is an error.
 * @return {Promise} A promise: resolves to `true` if the value was saved; `false` if not (usually because no storage method was available).
 */
export const setItem = async (
	key,
	value,
	{
		ttl = HOUR_IN_SECONDS,
		// Don't use the getReferenceDate selector here since there is no need in it.
		timestamp = Math.round( Date.now() / 1000 ), // eslint-disable-line sitekit/no-direct-date
		isError = false,
	} = {}
) => {
	const storage = await getStorage();

	if ( storage ) {
		try {
			storage.setItem(
				`${ STORAGE_KEY_PREFIX }${ key }`,
				JSON.stringify( {
					timestamp,
					ttl,
					value,
					isError,
				} )
			);

			return true;
		} catch ( error ) {
			global.console.warn(
				'Encountered an unexpected storage error:',
				error
			);
			return false;
		}
	}

	return false;
};

/**
 * Removes cached data by key.
 *
 * Remove one piece of cached data from the persistent storage cache, by key.
 *
 * @since 1.5.0
 *
 * @param {string} key Name of cache key.
 * @return {Promise} A promise: resolves to `true` if the value was deleted; `false` if not (usually because no storage method was available).
 */
export const deleteItem = async ( key ) => {
	const storage = await getStorage();

	if ( storage ) {
		try {
			const fullKey = key.startsWith( STORAGE_KEY_PREFIX_ROOT )
				? key
				: `${ STORAGE_KEY_PREFIX }${ key }`;

			storage.removeItem( fullKey );

			return true;
		} catch ( error ) {
			global.console.warn(
				'Encountered an unexpected storage error:',
				error
			);
			return false;
		}
	}

	return false;
};

/**
 * Gets all cache keys created by Site Kit.
 *
 * @since 1.5.0
 *
 * @return {Promise} A promise: resolves to an array of all keys.
 */
export const getKeys = async () => {
	const storage = await getStorage();

	if ( storage ) {
		try {
			const keys = [];
			for ( let i = 0; i < storage.length; i++ ) {
				const itemKey = storage.key( i );
				if ( itemKey.indexOf( STORAGE_KEY_PREFIX_ROOT ) === 0 ) {
					keys.push( itemKey );
				}
			}

			return keys;
		} catch ( error ) {
			global.console.warn(
				'Encountered an unexpected storage error:',
				error
			);
			return [];
		}
	}

	return [];
};

/**
 * Removes the entire cache created by Site Kit.
 *
 * @since 1.5.0
 *
 * @return {Promise} A promise: resolves to `true` if the cache was cleared; `false` if there was an error.
 */
export const clearCache = async () => {
	const storage = await getStorage();

	if ( storage ) {
		const keys = await getKeys();

		for ( const key of keys ) {
			await deleteItem( key );
		}

		return true;
	}

	return false;
};
