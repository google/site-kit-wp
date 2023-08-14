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
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from './constants';
import FIXTURES from '../../modules/datastore/__fixtures__';
import { CORE_MODULES } from '../../modules/datastore/constants';
import fetchMock from 'fetch-mock';

describe( 'core/user authentication', () => {
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
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["pagespeed-insights"]': true,
		},
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
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

		describe( 'refreshCapabilities', () => {
			it( 'updates capabilities from server', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				expect(
					registry.select( CORE_USER ).getCapabilities()
				).toEqual( capabilities.permissions );

				const updatedCapabilities = {
					googlesitekit_view_dashboard: true,
					googlesitekit_manage_options: true,
					'googlesitekit_read_shared_module_data::["site-verification"]': true,
					'googlesitekit_read_shared_module_data::["tagmanager"]': true,
					'googlesitekit_read_shared_module_data::["optimize"]': false,
					'googlesitekit_read_shared_module_data::["adsense"]': false,
					'googlesitekit_manage_module_sharing_options::["search-console"]': true,
					'googlesitekit_read_shared_module_data::["search-console"]': false,
					'googlesitekit_read_shared_module_data::["analytics"]': false,
					'googlesitekit_read_shared_module_data::["pagespeed-insights"]': false,
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: updatedCapabilities,
						status: 200,
					}
				);

				await registry.dispatch( CORE_USER ).refreshCapabilities();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( CORE_USER ).getCapabilities()
				).toEqual( updatedCapabilities );
			} );

			it( 'sets permissionScopeError when API throws an error', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				expect(
					registry.select( CORE_USER ).getCapabilities()
				).toEqual( capabilities.permissions );

				const error = {
					code: 'rest_forbidden',
					message: 'Sorry, you are not allowed to do that.',
					data: { status: 401 },
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: error,
						status: 401,
					}
				);

				await registry.dispatch( CORE_USER ).refreshCapabilities();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErroredWith(
					'Google Site Kit API Error',
					'method:GET',
					'datapoint:permissions',
					'type:core',
					'identifier:user',
					'error:"Sorry, you are not allowed to do that."'
				);
				expect(
					registry.select( CORE_USER ).getPermissionScopeError()
				).toEqual( error );
				// Permissions should be unchanged.
				expect(
					registry.select( CORE_USER ).getCapabilities()
				).toEqual( capabilities.permissions );
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
			it( 'should return undefined if capabilities cannot be loaded', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: capabilities.permissions,
						status: 200,
					}
				);

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( 'unavailable_capability' );

				expect( hasCapability ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getCapabilities();
			} );

			it( 'should return FALSE if base capability is unavailable', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				expect(
					registry
						.select( CORE_USER )
						.hasCapability( 'unavailable_capability' )
				).toBe( false );
			} );

			it( 'should return TRUE if base capability is available with the value TRUE', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				const hasCapability = registry
					.select( CORE_USER )
					.hasCapability( PERMISSION_MANAGE_OPTIONS );

				expect( hasCapability ).toBe( true );
			} );

			it( 'should return FALSE if meta capability is unavailable', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

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
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

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
			it( 'should return undefined if modules are not loaded', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				const viewableModules = registry
					.select( CORE_USER )
					.getViewableModules();

				expect( viewableModules ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'should return an empty array if viewable permissions are not available', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

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
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities(
						capabilitiesWithPermission.permissions
					);

				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

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
					'analytics-4',
				] );
			} );
		} );

		describe( 'canViewSharedModule', () => {
			it( 'should return undefined if modules are not loaded', async () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: FIXTURES, status: 200 }
				);

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'search-console' );

				expect( canViewSharedModule ).toBeUndefined();

				await untilResolved( registry, CORE_MODULES ).getModules();
			} );

			it( 'should return FALSE if the module does not exist', () => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetModules( [
						{ slug: 'search-console', name: 'Search Console' },
					] );

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'invalid-module' );

				expect( canViewSharedModule ).toBe( false );
			} );

			it( 'should return FALSE if the module is not shared', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: false,
					},
				] );

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'search-console' );

				expect( canViewSharedModule ).toBe( false );
			} );

			it( 'should return undefined if the capabilities are not loaded', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/permissions'
					),
					{
						body: capabilities.permissions,
						status: 200,
					}
				);

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: true,
					},
				] );

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'search-console' );

				expect( canViewSharedModule ).toBeUndefined();

				await untilResolved( registry, CORE_USER ).getCapabilities();
			} );

			it( 'should return FALSE if the module is shared but the user does not have the view permission', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities( capabilities.permissions );

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: true,
					},
				] );

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'search-console' );

				expect( canViewSharedModule ).toBe( false );
			} );

			it( 'should return TRUE if the module is shared and the user has the view permission', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetCapabilities(
						capabilitiesWithPermission.permissions
					);

				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'search-console',
						name: 'Search Console',
						shareable: true,
					},
				] );

				const canViewSharedModule = registry
					.select( CORE_USER )
					.canViewSharedModule( 'search-console' );

				expect( canViewSharedModule ).toBe( true );
			} );
		} );
	} );
} );
