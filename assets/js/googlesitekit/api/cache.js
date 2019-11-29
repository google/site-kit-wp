/**
 * External dependencies
 */
import { cloneDeep, isEqual } from 'lodash';

let storageBackend;
/**
 * Override the storage backend.
 *
 * Largely used for tests. Should not be used directly.
 *
 * @param {*} backend Backend to set for the cache.
 */
export const _setSelectedStorageBackend = ( backend ) => {
	storageBackend = backend;
};

let storageKeyPrefix = 'googlesitekit_';
/**
 * Override the key prefix used in storage.
 *
 * Largely used for tests.
 *
 * @param {string} keyPrefix String to prefix storage keys with.
 */
export const _setStorageKeyPrefix = ( keyPrefix ) => {
	storageKeyPrefix = keyPrefix;
};

let storageOrder = [ 'localStorage', 'sessionStorage' ];
/**
 * Override the priority of storage mechanisms.
 *
 * Largely used for tests.
 *
 * @param {Array} order Ordered array of storage backends to use.
 */
export const _setStorageOrder = ( order ) => {
	storageOrder = order;
};

/**
 * Detects whether browser storage is both supported and available.
 *
 * @param {string} type Browser storage to test. Should be one of `localStorage` or `sessionStorage`.
 * @return {boolean} True if the given storage is available, false otherwise.
 */
const isStorageAvailable = ( type ) => {
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
		return e instanceof DOMException && (

			// everything except Firefox
			22 === e.code ||

			// Firefox
			1014 === e.code ||

			// test name field too, because code might not be present
			// everything except Firefox
			'QuotaExceededError' === e.name ||

			// Firefox
			'NS_ERROR_DOM_QUOTA_REACHED' === e.name ) &&

			// acknowledge QuotaExceededError only if there's something already stored
			0 !== storage.length;
	}
};

/**
 * Gets the storage object to use.
 *
 * @return {Object} Return a storage mechanism (`localStorage` or `sessionStorage`) if available; otherwise returns `null`;
 */
const getStorage = () => {
	// If `googlesitekit.admin.nojscache` is `true`, we should never use
	// the cache.
	if ( global.googlesitekit && global.googlesitekit.admin && global.googlesitekit.admin.nojscache ) {
		return null;
	}

	// Only run the logic to determine the storage object once.
	if ( storageBackend === undefined ) {
		storageOrder.forEach( ( backend ) => {
			if ( storageBackend ) {
				return;
			}

			if ( isStorageAvailable( backend ) ) {
				storageBackend = global[ backend ];
			}
		} );

		if ( storageBackend === undefined ) {
			storageBackend = null;
		}
	}

	return storageBackend;
};

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
export const get = async ( key, cacheTimeToLive = null ) => {
	const storage = getStorage();

	if ( storage ) {
		const cachedData = storage.getItem( `${ storageKeyPrefix }${ key }` );

		if ( cachedData ) {
			const parsedData = JSON.parse( cachedData );

			// Ensure a timestamp is found, otherwise this isn't a valid cache hit.
			// (We don't check for a truthy `value`, because it could be legitimately
			// false-y if `0`, `null`, etc.)
			if ( parsedData.timestamp && (
				cacheTimeToLive === null || // Ensure the cached data isn't too old.
        ( Date.now() / 1000 ) - parsedData.timestamp < cacheTimeToLive
			) ) {
				return {
					cacheHit: true,
					value: cloneDeep( parsedData.value ),
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
export const set = async ( key, value, _timestamp = undefined ) => {
	const storage = getStorage();

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

			storage.setItem( `${ storageKeyPrefix }${ key }`, JSON.stringify( {
				timestamp: _timestamp || ( Date.now() / 1000 ),
				value,
			} ) );

			return true;
		} catch ( error ) {
			global.console.warn( 'Encountered an unexpected storage error:', error );
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
	const storage = getStorage();

	if ( storage ) {
		try {
			storage.removeItem( `${ storageKeyPrefix }${ key }` );

			return true;
		} catch ( error ) {
			global.console.warn( 'Encountered an unexpected storage error:', error );
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
	const storage = getStorage();

	if ( storage ) {
		try {
			const keys = [];
			for ( let i = 0; i < storage.length; i++ ) {
				const itemKey = storage.key( i );
				if ( itemKey.indexOf( storageKeyPrefix ) === 0 ) {
					keys.push( itemKey.substring( storageKeyPrefix.length ) );
				}
			}

			return keys;
		} catch ( error ) {
			global.console.warn( 'Encountered an unexpected storage error:', error );
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
	const storage = getStorage();

	if ( storage ) {
		const keys = await getKeys();

		for ( const key of keys ) {
			await deleteItem( key );
		}

		return true;
	}

	return false;
};
