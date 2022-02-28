/**
 * `core/user` data store: Authentication info tests.
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from './constants';

describe( 'core/user authentication', () => {
	const capabilitiesBaseVar = '_googlesitekitUserData';

	const capabilities = {
		permissions: {
			googlesitekit_view_dashboard: true,
			googlesitekit_manage_options: true,
			"googlesitekit_manage_module_sharing_options::['search-console']": true,
			"googlesitekit_read_shared_module_data::['search-console']": false,
		},
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ capabilitiesBaseVar ];
	} );

	describe( 'actions', () => {
		describe( 'setPermissionScopeError', () => {
			it( 'requires the error param', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).setPermissionScopeError();
				} ).toThrow( 'permissionError is required.' );
			} );

			it( 'sets the error', () => {
				const someError = { status: 500, message: 'Bad' };
				registry
					.dispatch( CORE_USER )
					.setPermissionScopeError( someError );

				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toEqual( someError );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getPermissionScopeError', () => {
			it( 'returns null when no error is set', async () => {
				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toEqual( null );
			} );

			it( 'returns the error once set', async () => {
				const someError = { status: 500, message: 'Bad' };
				registry
					.dispatch( CORE_USER )
					.setPermissionScopeError( someError );

				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toEqual( someError );
			} );
		} );

		describe( 'hasCapability', () => {
			it( 'should return undefined if getCapabilities are not resolved', async () => {
				global[ capabilitiesBaseVar ] = undefined;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( 'Unavailable Capability' );

				expect( console ).toHaveErrored();
				expect( hasCapability ).toBeUndefined();
			} );

			it( 'should return FALSE if base capbality is unavailable', async () => {
				global[ capabilitiesBaseVar ] = capabilities;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( 'unavailable_capability' );

				expect( hasCapability ).toBe( false );
			} );

			it( 'should return TRUE if base capbality is available with the value TRUE', async () => {
				global[ capabilitiesBaseVar ] = capabilities;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( PERMISSION_MANAGE_OPTIONS );

				expect( hasCapability ).toBe( true );
			} );

			it( 'should return FALSE if meta capbality is unavailable', async () => {
				global[ capabilitiesBaseVar ] = capabilities;
				const stringifySpy = jest.spyOn( JSON, 'stringify' );

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability(
						'unavailable_capability',
						'search-console'
					);

				expect( stringifySpy ).toHaveBeenCalledWith( [
					'search-console',
				] );
				expect( hasCapability ).toBe( false );
			} );
			it( 'should return TRUE if meta capbality is available with the value TRUE', async () => {
				global[ capabilitiesBaseVar ] = capabilities;
				const stringifySpy = jest.spyOn( JSON, 'stringify' );

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability(
						'googlesitekit_manage_module_sharing_options',
						'search-console'
					);

				expect( stringifySpy ).toHaveBeenCalledWith( [
					'search-console',
				] );
				expect( hasCapability ).toBe( true );
			} );
		} );
	} );
} );
