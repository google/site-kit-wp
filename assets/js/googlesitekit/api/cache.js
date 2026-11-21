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
import { HOUR_IN_SECONDS } from '@/js/util';

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

/**
 * Matches the full key of an item that the cache keeps in the shared storage:
 * the prefix of a Site Kit version and of a login session, then a key that
 * `createCacheKey()` built, which always has `::` in it.
 *
 * Site Kit keeps other items in `localStorage`, such as
 * `googlesitekit_notification_seen`, which don't match, so clearing the cache
 * never deletes them.
 *
 * @since n.e.x.t
 * @private
 */
const SHARED_ITEM_KEY_PATTERN = new RegExp(
	`^${ STORAGE_KEY_PREFIX_ROOT }[^_]+_[^_]+_.*::`
);

const defaultOrder = [ 'sessionStorage', 'localStorage' ];
let storageBackend;
let sharedStorageBackend;
let storageOrder = [ ...defaultOrder ];

/**
 * Overrides the storage backend.
 *
 * Largely used for tests. Should not be used directly.
 *
 * @since 1.5.0
 * @since n.e.x.t Also resets the shared storage backend, which depends on it.
 * @private
 *
 * @param {*} backend Backend to set for the cache.
 */
export function setSelectedStorageBackend( backend ) {
	storageBackend = backend;
	sharedStorageBackend = undefined;
}

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
export function setStorageOrder( order ) {
	storageOrder = [ ...order ];
	setSelectedStorageBackend( undefined );
}

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
export function resetDefaultStorageOrder() {
	storageOrder = [ ...defaultOrder ];
	setSelectedStorageBackend( undefined );
}

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
export async function isStorageAvailable( type ) {
	const storage = global[ type ];

	if ( ! storage ) {
		return false;
	}

	try {
		const x = '__storage_test__';

		storage.setItem( x, x );
		storage.removeItem( x );
		return true;
	} catch ( error ) {
		return (
			error instanceof DOMException &&
			// everything except Firefox
			( 22 === error.code ||
				// Firefox
				1014 === error.code ||
				// test name field too, because code might not be present
				// everything except Firefox
				'QuotaExceededError' === error.name ||
				// Firefox
				'NS_ERROR_DOM_QUOTA_REACHED' === error.name ) &&
			// acknowledge QuotaExceededError only if there's something already stored
			0 !== storage.length
		);
	}
}

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
 * Gets the storage of the items that every tab of a login session shares.
 *
 * The rest of the cache prefers `sessionStorage`, which keeps an item for one
 * tab. A shared item goes to `localStorage`, so another tab, or the same tab
 * after the browser restarts, reads it while it is valid. Its key has the same
 * prefix, which has a hash of the user's login and session, so another user or
 * a new login session never reads it.
 *
 * Without `localStorage`, a shared item goes where the rest of the cache does,
 * and without any storage, the cache keeps nothing.
 *
 * @since n.e.x.t
 * @private
 *
 * @return {Promise<Storage|null>} The storage of the shared items, or null when none is available.
 */
export async function getSharedStorage() {
	if ( sharedStorageBackend !== undefined ) {
		return sharedStorageBackend;
	}

	const storage = await getStorage();

	sharedStorageBackend =
		storage && ( await isStorageAvailable( 'localStorage' ) )
			? global.localStorage
			: storage;

	return sharedStorageBackend;
}

/**
 * Deletes the shared items whose time has passed.
 *
 * The cache reads an item only while it is valid, but it never deletes one
 * that has expired. `sessionStorage` empties when its tab closes, while
 * `localStorage` keeps an item until something deletes it, so the cache
 * deletes the expired shared items each time it writes one. An item that
 * isn't valid JSON can't be read either, so it goes too.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Storage} storage The storage of the shared items.
 */
function deleteExpiredSharedItems( storage ) {
	// The cache dates rely on the actual time, as `getItem()` explains.
	const now = Math.round( Date.now() / 1000 ); // eslint-disable-line sitekit/no-direct-date

	// Backwards, since deleting an item moves the indexes of those after it.
	for ( let index = storage.length - 1; index >= 0; index-- ) {
		const itemKey = storage.key( index );

		if ( ! itemKey || ! SHARED_ITEM_KEY_PATTERN.test( itemKey ) ) {
			continue;
		}

		let isExpired;

		try {
			const { timestamp, ttl } =
				JSON.parse( storage.getItem( itemKey ) ) || {};

			isExpired = ! timestamp || ( !! ttl && now - timestamp >= ttl );
		} catch {
			isExpired = true;
		}

		if ( isExpired ) {
			storage.removeItem( itemKey );
		}
	}
}

/**
 * Gets cached data.
 *
 * Get cached data from the persistent storage cache.
 *
 * @since 1.5.0
 * @since n.e.x.t Added the `shared` option.
 *
 * @param {string}  key              Name of cache key.
 * @param {Object}  [options]        Optional. Options for the read.
 * @param {boolean} [options.shared] Optional. Whether to read an item that every tab of the login session shares, which `setItem()` wrote with `shared`. Default is `false`.
 * @return {Promise} A promise returned, containing an object with the cached value (if found) and whether or not there was a cache hit.
 */
export async function getItem( key, { shared = false } = {} ) {
	const storage = shared ? await getSharedStorage() : await getStorage();

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
					// The cache dates shouldn't rely on reference
					// dates for cache expiration. This is a case
					// where we actually want to rely on
					// the _actual_ date/time the data was set.
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
}

/**
 * Sets cached data using a key.
 *
 * Save data to the relevant local storage mechanism, if available.
 * By default, data is saved with a one hour (60 minute) TTL.
 *
 * @since 1.5.0
 * @since n.e.x.t Added the `shared` option.
 *
 * @param {string}  key              Name of cache key.
 * @param {*}       value            Value to store in the cache.
 * @param {Object}  args             Optional object containing ttl, timestamp, isError and shared keys.
 * @param {number}  [args.ttl]       Optional. Validity of the cached item in seconds.
 * @param {number}  [args.timestamp] Optional. Timestamp when the cached item was created.
 * @param {boolean} [args.isError]   Optional. Whether the cached item is an error.
 * @param {boolean} [args.shared]    Optional. Whether every tab of the login session shares the item, as `getSharedStorage()` explains. Default is `false`.
 * @return {Promise} A promise: resolves to `true` if the value was saved; `false` if not (usually because no storage method was available).
 */
export async function setItem(
	key,
	value,
	{
		ttl = HOUR_IN_SECONDS,
		// Cached times should rely on real times, not the reference date,
		// so the cache timeouts are consistent even when changing
		// the reference dates when developing/testing.
		timestamp = Math.round( Date.now() / 1000 ), // eslint-disable-line sitekit/no-direct-date
		isError = false,
		shared = false,
	} = {}
) {
	const storage = shared ? await getSharedStorage() : await getStorage();

	if ( storage ) {
		try {
			if ( shared ) {
				deleteExpiredSharedItems( storage );
			}

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
}

/**
 * Removes cached data by key.
 *
 * Remove one piece of cached data from the persistent storage cache, by key.
 * A shared item with the key goes too, so a deleted item is never read back
 * from another storage.
 *
 * @since 1.5.0
 * @since n.e.x.t Also deletes the shared item with the key.
 *
 * @param {string} key Name of cache key.
 * @return {Promise} A promise: resolves to `true` if the value was deleted; `false` if not (usually because no storage method was available).
 */
export async function deleteItem( key ) {
	const storage = await getStorage();

	if ( storage ) {
		try {
			const fullKey = key.startsWith( STORAGE_KEY_PREFIX_ROOT )
				? key
				: `${ STORAGE_KEY_PREFIX }${ key }`;

			storage.removeItem( fullKey );

			const sharedStorage = await getSharedStorage();

			if (
				sharedStorage !== storage &&
				SHARED_ITEM_KEY_PATTERN.test( fullKey )
			) {
				sharedStorage.removeItem( fullKey );
			}

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
}

/**
 * Gets all cache keys created by Site Kit.
 *
 * The keys of the shared items are included, so `clearCache()` and
 * `invalidateCache()` delete them as well.
 *
 * @since 1.5.0
 * @since n.e.x.t Includes the keys of the shared items.
 *
 * @return {Promise} A promise: resolves to an array of all keys.
 */
export async function getKeys() {
	const storage = await getStorage();

	if ( storage ) {
		try {
			const keys = [];
			for ( let index = 0; index < storage.length; index++ ) {
				const itemKey = storage.key( index );
				if ( itemKey.indexOf( STORAGE_KEY_PREFIX_ROOT ) === 0 ) {
					keys.push( itemKey );
				}
			}

			const sharedStorage = await getSharedStorage();

			if ( sharedStorage !== storage ) {
				for ( let index = 0; index < sharedStorage.length; index++ ) {
					const itemKey = sharedStorage.key( index );
					if (
						SHARED_ITEM_KEY_PATTERN.test( itemKey ) &&
						! keys.includes( itemKey )
					) {
						keys.push( itemKey );
					}
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
}

/**
 * Removes the entire cache created by Site Kit.
 *
 * @since 1.5.0
 *
 * @return {Promise} A promise: resolves to `true` if the cache was cleared; `false` if there was an error.
 */
export async function clearCache() {
	const storage = await getStorage();

	if ( storage ) {
		const keys = await getKeys();

		for ( const key of keys ) {
			await deleteItem( key );
		}

		return true;
	}

	return false;
}
