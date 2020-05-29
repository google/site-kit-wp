/**
 * modules/analytics data store: permissions tests.
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
 * Internal dependencies
 */
import { STORE_NAME, PROVISIONING_SCOPE } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from 'tests/js/utils';

describe( 'modules/analytics profiles', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'hasProvisioningScope', () => {
			it( 'returns undefined if granted scopes not loaded yet', async () => {
				registry.dispatch( CORE_USER ).receiveAuthentication( {
					authenticated: true,
					requiredScopes: [],
					grantedScopes: undefined,
				} );

				expect( registry.select( STORE_NAME ).hasProvisioningScope() ).toEqual( undefined );
			} );

			it( 'returns false if scope has not been granted', async () => {
				registry.dispatch( CORE_USER ).receiveAuthentication( {
					authenticated: true,
					requiredScopes: [],
					grantedScopes: [],
				} );

				expect( registry.select( STORE_NAME ).hasProvisioningScope() ).toBe( false );
			} );

			it( 'returns true if scope has been granted', async () => {
				registry.dispatch( CORE_USER ).receiveAuthentication( {
					authenticated: true,
					requiredScopes: [],
					grantedScopes: [ 'some-scope', PROVISIONING_SCOPE ],
				} );

				expect( registry.select( STORE_NAME ).hasProvisioningScope() ).toBe( true );
			} );
		} );
	} );
} );
