/**
 * core/user Data store: disconnect tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import fetchMock from 'fetch-mock-jest';

/**
 * Internal dependencies
 */
import { createTestRegistry, unsubscribeFromAll } from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/user disconnect', () => {
	let registry;
	const coreUserDataDisconnectEndpointRegExp = /^\/google-site-kit\/v1\/core\/user\/data\/disconnect/;

	beforeEach( () => {
		// Create a mock to avoid triggering a network request error.
		// The return value is irrelevant to the test.
		fetchMock.once(
			coreUserDataDisconnectEndpointRegExp,
			{ body: {}, status: 200 }
		);
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		fetchMock.restore();
		fetchMock.mockClear();
	} );

	describe( 'disconnect', () => {
		it( 'does not require any params', () => {
			expect( () => {
				registry.dispatch( STORE_NAME ).disconnect();
			} ).not.toThrow();
		} );
	} );

	describe( 'receiveDisconnect', () => {
		it( 'requires the disconnect param', () => {
			expect( () => {
				registry.dispatch( STORE_NAME ).receiveDisconnected();
			} ).toThrow( 'disconnect is required.' );
		} );
	} );
} );
