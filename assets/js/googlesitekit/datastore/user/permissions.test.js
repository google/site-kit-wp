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
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from './constants';
import FIXTURES from '../../modules/datastore/__fixtures__';

describe( 'core/user authentication', () => {
	const capabilitiesBaseVar = '_googlesitekitUserData';

	const capabilities = {
		permissions: {
			googlesitekit_view_dashboard: true,
			googlesitekit_manage_options: true,
			'googlesitekit_read_shared_module_data::["site-verification"]': false,
			'googlesitekit_read_shared_module_data::["tagmanager"]': false,
			'googlesitekit_read_shared_module_data::["optimize"]': false,
			'googlesitekit_read_shared_module_data::["adsense"]': false,
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_read_shared_module_data::["search-console"]': false,
			'googlesitekit_read_shared_module_data::["analytics"]': false,
			'googlesitekit_read_shared_module_data::["pagespeed-insights"]': false,
			'googlesitekit_read_shared_module_data::["idea-hub"]': false,
		},
	};

	const capabilitiesWithPermission = {
		permissions: {
			googlesitekit_view_dashboard: true,
			googlesitekit_manage_options: true,
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics"]': true,
			'googlesitekit_read_shared_module_data::["site-verification"]': false,
			'googlesitekit_read_shared_module_data::["tagmanager"]': false,
			'googlesitekit_read_shared_module_data::["optimize"]': false,
			'googlesitekit_read_shared_module_data::["adsense"]': false,
			'googlesitekit_read_shared_module_data::["search-console"]': true,
			'googlesitekit_read_shared_module_data::["analytics"]': true,
			'googlesitekit_read_shared_module_data::["pagespeed-insights"]': true,
			'googlesitekit_read_shared_module_data::["idea-hub"]': false,
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
			it( 'returns null when no error is set', () => {
				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toEqual( null );
			} );

			it( 'returns the error once set', () => {
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
			it( 'should return undefined if capabilities cannot be loaded', () => {
				global[ capabilitiesBaseVar ] = undefined;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( 'unavailable_capability' );

				expect( console ).toHaveErrored();
				expect( hasCapability ).toBeUndefined();
			} );

			it( 'should return FALSE if base capability is unavailable', () => {
				global[ capabilitiesBaseVar ] = capabilities;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( 'unavailable_capability' );

				expect( hasCapability ).toBe( false );
			} );

			it( 'should return TRUE if base capability is available with the value TRUE', () => {
				global[ capabilitiesBaseVar ] = capabilities;

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( PERMISSION_MANAGE_OPTIONS );

				expect( hasCapability ).toBe( true );
			} );

			it( 'should return FALSE if meta capability is unavailable', () => {
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

			it( 'should return TRUE if meta capability is available with the value TRUE', () => {
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

		describe( 'getViewableModules', () => {
			it( 'should return undefined if modules are not loaded', () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const viewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( viewableModules ).toBeUndefined();
			} );

			it( 'should return an empty array if viewable permissions are not available', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				global[ capabilitiesBaseVar ] = capabilities;

				const initialViewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( initialViewableModules ).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getViewableModules() !==
						undefined
				);

				const viewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( viewableModules ).toEqual( [] );
			} );

			it( 'should return the list of module slugs if the viewable permissions are available', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				global[ capabilitiesBaseVar ] = capabilitiesWithPermission;

				const initialViewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( initialViewableModules ).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getViewableModules() !==
						undefined
				);

				const viewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( viewableModules ).toEqual( [
					'search-console',
					'analytics',
					'pagespeed-insights',
				] );
			} );
		} );

		describe( 'getManageableModules', () => {
			it( 'should return undefined if modules are not loaded', () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				const manageableModules = registry
					.select( CORE_USER )
					.getManageableModules();

				expect( manageableModules ).toBeUndefined();
			} );

			it( 'should return an empty array if manageable permissions are not available', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);
				global[ capabilitiesBaseVar ] = {
					...capabilities,
					...{
						permissions: {
							'googlesitekit_manage_module_sharing_options::["search-console"]': false,
						},
					},
				};

				const initialManageableModules = registry
					.select( CORE_USER )
					.getManageableModules();

				expect( initialManageableModules ).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getManageableModules() !==
						undefined
				);

				const manageableModules = registry
					.select( CORE_USER )
					.getManageableModules();

				expect( manageableModules ).toEqual( [] );
			} );

			it( 'should return the list of module slugs if the manageable permissions are available', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/,
					{ body: FIXTURES, status: 200 }
				);

				global[ capabilitiesBaseVar ] = capabilitiesWithPermission;

				const initialManageableModules = registry
					.select( CORE_USER )
					.getManageableModules();

				expect( initialManageableModules ).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getManageableModules() !==
						undefined
				);

				const manageableModules = registry
					.select( CORE_USER )
					.getManageableModules();

				expect( manageableModules ).toEqual( [
					'search-console',
					'analytics',
				] );
			} );
		} );
	} );
} );
