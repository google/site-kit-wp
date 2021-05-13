/**
 * `modules/analytics-4` data store: api tests.
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
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';

describe( 'modules/analytics-4 properties', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'isAdminAPIWorking', () => {
			it( 'should return TRUE when no errors present', () => {
				expect( registry.select( STORE_NAME ).isAdminAPIWorking() ).toBe( true );
			} );

			it( 'should return FALSE when getProperties errored', () => {
				registry.dispatch( STORE_NAME ).receiveError( {}, 'getProperties', [ '1000' ] );
				expect( registry.select( STORE_NAME ).isAdminAPIWorking() ).toBe( false );
			} );

			it( 'should return FALSE when getWebDataStreams errored', () => {
				registry.dispatch( STORE_NAME ).receiveError( {}, 'getWebDataStreams', [ '2000' ] );
				expect( registry.select( STORE_NAME ).isAdminAPIWorking() ).toBe( false );
			} );
		} );
	} );
} );
