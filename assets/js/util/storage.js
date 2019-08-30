/**
 * Storage abstraction.
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
 * Detects whether browser storage is both supported and available.
 *
 * @param {string} type Browser storage to test. ex localStorage or sessionStorage.
 * @return {boolean} True if the given storage is available, false otherwise.
 */
export const storageAvailable = ( type ) => {
	const storage = window[ type ];
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
 * Detects whether and which persistent storage is available.
 *
 * @return {mixed} Either 'sessionStorage', 'localStorage', or undefined.
 */
const getStorageName = () => {
	if ( storageAvailable( 'sessionStorage' ) ) {
		return 'sessionStorage';
	}

	if ( storageAvailable( 'localStorage' ) ) {
		return 'localStorage';
	}

	return undefined;
};

export const storage = {
	/**
	 * Checks if the storage is available.
	 *
	 * @return {boolean} True if the storage is available, false otherwise.
	 */
	isAvailable() {
		return !! getStorageName();
	},

	/**
	 * Sets an item in the storage.
	 *
	 * @param {string} key   The key to set.
	 * @param {string} value The value to set for the key.
	 */
	setItem( key, value ) {
		const storageName = getStorageName();
		if ( ! storageName ) {
			return;
		}

		window[ storageName ].setItem( key, value );
	},

	/**
	 * Gets an item from the storage.
	 *
	 * @param {string} key The key to get.
	 *
	 * @return {string?} The value for the key, or null if not set.
	 */
	getItem( key ) {
		const storageName = getStorageName();
		if ( ! storageName ) {
			return null;
		}

		return window[ storageName ].getItem( key );
	},

	/**
	 * Removes an item from the storage.
	 *
	 * @param {string} key The key to remove.
	 */
	removeItem( key ) {
		const storageName = getStorageName();
		if ( ! storageName ) {
			return;
		}

		window[ storageName ].removeItem( key );
	},

	/**
	 * Gets a list of all keys set in the storage.
	 *
	 * @return {Array<string>} List of keys.
	 */
	getItems() {
		const storageName = getStorageName();
		if ( ! storageName ) {
			return [];
		}

		return Object.keys( window[ storageName ] );
	},
};
