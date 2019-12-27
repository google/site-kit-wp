/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * Internal dependencies
 */
import {
	STORAGE_KEY_PREFIX,
	getStorage,
} from './cache.private';

/**
 * Get cached data.
 *
 * Get cached data from the persistent storage cache.
 *
 * @param {string} key              Name of cache key.
 * @param {number} cacheTimeToLive  The number of seconds before cached data will be considered stale. If the cached data is more than this many seconds old no data will be returned. If not set/set to `null`, any data will be returned.
 *
 * @return {Promise} A promise returned, containing an object with the cached value (if found) and whether or not there was a cache hit.
 */
export const getItem = async ( key, cacheTimeToLive = null ) => {
	const storage = await getStorage();

	if ( storage ) {
		const cachedData = storage.getItem( `${ STORAGE_KEY_PREFIX }${ key }` );

		if ( cachedData ) {
			const parsedData = JSON.parse( cachedData );

			// Ensure a timestamp is found, otherwise this isn't a valid cache hit.
			// (We don't check for a truthy `value`, because it could be legitimately
			// false-y if `0`, `null`, etc.)
			if ( parsedData.timestamp && (
				cacheTimeToLive === null || // Ensure the cached data isn't too old.
				Math.round( Date.now() / 1000 ) - parsedData.timestamp < cacheTimeToLive
			) ) {
				return {
					cacheHit: true,
					value: parsedData.value,
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
 * Set cached data using a key.
 *
 * Save data to the relevant local storage mechanism, if available.
 *
 * @param {string} key        Name of cache key.
 * @param {*}      value      Value to store in the cache.
 * @param {number} _timestamp Timestamp to set as the cache data save time.
 *
 * @return {Promise} A promise: resolves to `true` if the value was saved; `false` if not (usually because no storage method was available).
 */
export const setItem = async ( key, value, _timestamp = undefined ) => {
	const storage = await getStorage();

	if ( storage ) {
		try {
			// Don't save truthy values that can't be saved by `JSON.stringify`.
			// This prevents unserializable objects like `ArrayBuffer`s from being
			// saved as empty objects, etc.
			if ( ! isEqual(
				value,
				JSON.parse( JSON.stringify( { value } ) ).value
			) ) {
				return false;
			}

			storage.setItem( `${ STORAGE_KEY_PREFIX }${ key }`, JSON.stringify( {
				timestamp: _timestamp || Math.round( Date.now() / 1000 ),
				value,
			} ) );

			return true;
		} catch ( error ) {
			window.console.warn( 'Encountered an unexpected storage error:', error );
			return false;
		}
	}

	return false;
};

/**
 * Remove cached data by key.
 *
 * Remove one piece of cached data from the persistent storage cache, by key.
 *
 * @param {string} key Name of cache key.
 *
 * @return {Promise} A promise: resolves to `true` if the value was deleted; `false` if not (usually because no storage method was available).
 */
export const deleteItem = async ( key ) => {
	const storage = await getStorage();

	if ( storage ) {
		try {
			storage.removeItem( `${ STORAGE_KEY_PREFIX }${ key }` );

			return true;
		} catch ( error ) {
			window.console.warn( 'Encountered an unexpected storage error:', error );
			return false;
		}
	}

	return false;
};

/**
 * Get all cache keys created by Site Kit.
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
				if ( itemKey.indexOf( STORAGE_KEY_PREFIX ) === 0 ) {
					keys.push( itemKey.substring( STORAGE_KEY_PREFIX.length ) );
				}
			}

			return keys;
		} catch ( error ) {
			window.console.warn( 'Encountered an unexpected storage error:', error );
			return [];
		}
	}

	return [];
};

/**
 * Remove the entire cache created by Site Kit.
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
