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
import faker from 'faker';
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
	// Use real timers in order to be able to wait for them. This was introduced to support the changes introduced in @wordpress/data 4.23.0
	// which adds a resolver cache and a related call to setTimeout to each resolver, and these timeouts often need to be waited for in tests.
	// See https://github.com/WordPress/gutenberg/blob/07baf5a12007d31bbd4ee22113b07952f7eacc26/packages/data/src/namespace-store/index.js#L294-L310.
	// Using real timers, rather than fake timers here ensures that we don't need to manually advance timers for every resolver call.
	jest.useRealTimers();

	localStorage.clear();
	sessionStorage.clear();

	// Clear the mocks for all localStorage/sessionStorage methods.
	[ 'getItem', 'setItem', 'removeItem', 'key' ].forEach( ( method ) => {
		localStorage[ method ].mockClear();
		sessionStorage[ method ].mockClear();
	} );

	// This number is arbitrary, but needs to be consistent across test runs.
	// Changing this will cause some tests to fail and others to have the
	// _potential_ to fail, see:
	// https://github.com/google/site-kit-wp/issues/5053
	const knownSafeSeed = 500;
	// Make random numbers created by Faker predictable, in case we want
	// to use snapshots for any fixture data.
	faker.seed( knownSafeSeed );
} );

afterEach( async () => {
	// In order to catch (most) unhandled promise rejections
	// we need to wait at least one more event cycle.
	// To do this, we need to switch back to real timers if we're currently using fake timers.
	if ( jest.isMockFunction( setTimeout ) ) {
		jest.useRealTimers();
	}

	const nextTick = () => new Promise( ( resolve ) => setTimeout( resolve ) );
	await nextTick();
} );

afterEach( () => fetchMock.mockReset() );
afterEach( () => enabledFeatures.clear() );
