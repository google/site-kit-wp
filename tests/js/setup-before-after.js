/**
 * Jest common setup.
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
 * External dependencies
 */
import fetchMockJest from 'fetch-mock-jest';

/**
 * Internal dependencies
 */
import { enabledFeatures } from '../../assets/js/features';

// Set fetchMock global so we don't have to import fetchMock in every test.
// This global is instantiated in tests/js/setup-globals.js.
// It is re-set here since fetch-mock-jest must be imported during Jest's `setupFilesAfterEnv` or later.
global.fetchMock = fetchMockJest;

beforeEach( () => {
	localStorage.clear();
	sessionStorage.clear();

	// Clear the mocks for all localStorage/sessionStorage methods.
	[ 'getItem', 'setItem', 'removeItem', 'key' ].forEach( ( method ) => {
		localStorage[ method ].mockClear();
		sessionStorage[ method ].mockClear();
	} );
} );

afterEach( async () => {
	// In order to catch (most) unhandled promise rejections
	// we need to wait at least one more event cycle.
	// To do this, we need to use real timers temporarily if not already configured.
	const nextTick = () => new Promise( ( resolve ) => setTimeout( resolve ) );
	if ( jest.isMockFunction( setTimeout ) ) {
		jest.useRealTimers();
		await nextTick();
		jest.useFakeTimers();
	} else {
		await nextTick();
	}
} );

afterEach( () => fetchMock.mockReset() );
afterEach( () => enabledFeatures.clear() );
