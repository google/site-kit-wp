/**
 * Vitest localStorage and sessionStorage mock.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { vi } from 'vitest';

// Based on jest-localstorage-mock but adapted for Vitest
// https://github.com/clarkbw/jest-localstorage-mock

class StorageMock {
	constructor() {
		this.store = {};
		this.getItem = vi.fn( ( key ) => this.store[ key ] || null );
		this.setItem = vi.fn( ( key, value ) => {
			this.store[ key ] = String( value );
		} );
		this.removeItem = vi.fn( ( key ) => {
			delete this.store[ key ];
		} );
		this.clear = vi.fn( () => {
			this.store = {};
		} );
		this.key = vi.fn( ( index ) => {
			const keys = Object.keys( this.store );
			return keys[ index ] || null;
		} );
	}
}

global.localStorage = new StorageMock();
global.sessionStorage = new StorageMock();
