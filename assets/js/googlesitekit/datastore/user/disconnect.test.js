/**
 * `core/user` data store: disconnect tests.
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
import { createTestRegistry, muteFetch } from '../../../../../tests/js/utils';
import { CORE_USER } from './constants';

describe( 'core/user disconnect', () => {
	let registry;
	const coreUserDataDisconnectEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/disconnect'
	);

	beforeEach( () => {
		// Create a mock to avoid triggering a network request error.
		// The return value is irrelevant to the test.
		muteFetch( coreUserDataDisconnectEndpointRegExp );
		registry = createTestRegistry();
	} );

	describe( 'disconnect', () => {
		it( 'does not require any params', () => {
			expect( () => {
				registry.dispatch( CORE_USER ).disconnect();
			} ).not.toThrow();
		} );
	} );

	describe( 'receiveDisconnect', () => {
		it( 'requires the response param', () => {
			expect( () => {
				registry.dispatch( CORE_USER ).receiveDisconnect();
			} ).toThrow( 'response is required.' );
		} );
	} );
} );
