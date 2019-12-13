let storageBackend;
/**
 * Override the storage backend.
 *
 * Largely used for tests. Should not be used directly.
 *
 * @param {*} backend Backend to set for the cache.
 */
export const setSelectedStorageBackend = ( backend ) => {
	storageBackend = backend;
};

export const StorageKeyPrefix = 'googlesitekit_';

const defaultOrder = [ 'localStorage', 'sessionStorage' ];
let storageOrder = [ ...defaultOrder	];
/**
 * Override the priority of storage mechanisms.
 *
 * Largely used for tests. Implicitly resets the selected storage backend,
 * causing `_getStorage` to re-run its checks for the best available
 * storage backend.
 *
 * @param {Array} order Ordered array of storage backends to use.
 */
export const setStorageOrder = ( order ) => {
	storageOrder = [ ...order ];
	setSelectedStorageBackend( undefined );
};

/**
 * Reset the storage mechanism order.
 *
 * Largely used for tests. Implicitly resets the selected storage backend,
 * causing `_getStorage` to re-run its checks for the best available
 * storage backend.
 */
export const resetDefaultStorageOrder = () => {
	storageOrder = [ ...defaultOrder ];
	setSelectedStorageBackend( undefined );
};

/**
 * Detects whether browser storage is both supported and available.
 *
 * @param {string} type Browser storage to test. Should be one of `localStorage` or `sessionStorage`.
 * @return {boolean} True if the given storage is available, false otherwise.
 */
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
export const getStorage = async () => {
	// If `googlesitekit.admin.nojscache` is `true`, we should never use
	// the cache.
	if ( window.googlesitekit && window.googlesitekit.admin && window.googlesitekit.admin.nojscache ) {
		return null;
	}

	// Only run the logic to determine the storage object once.
	if ( storageBackend === undefined ) {
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
	}

	return storageBackend;
};
