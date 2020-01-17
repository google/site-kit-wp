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

// Custom no-op implementation of global.Storage.
class NullStorage {
	get length() {
		return 0;
	}

	key() {
		return null;
	}

	getItem() {
		return null;
	}

	setItem() {
		// Empty method body.
	}

	removeItem() {
		// Empty method body.
	}

	clear() {
		// Empty method body.
	}
}

let storageObj;

/**
 * Gets the storage object to use.
 *
 * @return {Storage} Either global.sessionStorage, global.localStorage', or a
 *                   no-op implementation if neither is available.
 */
export const getStorage = () => {
	// Only run the logic to determine the storage object once.
	if ( ! storageObj ) {
		if ( storageAvailable( 'sessionStorage' ) ) {
			storageObj = global.sessionStorage;
		} else if ( storageAvailable( 'localStorage' ) ) {
			storageObj = global.localStorage;
		} else {
			storageObj = new NullStorage();
		}
	}
	return storageObj;
};
