/**
 * `useActivateModuleCallback` hook tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	provideModules,
	provideModuleRegistrations,
	provideSiteInfo,
	provideUserCapabilities,
	renderHook,
} from '../../../tests/js/test-utils';
import { getItem } from '../googlesitekit/api/cache';
import { mockLocation } from '../../../tests/js/mock-browser-utils';
import * as tracking from '../util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';
import useActivateModuleCallback from './useActivateModuleCallback';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'useActivateModuleCallback', () => {
	mockLocation();
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry, [
			{ slug: 'module-with-no-name', name: null },
		] );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry );
	} );

	it( 'should return a callback that activates the specified module', async () => {
		const { result } = renderHook(
			() => useActivateModuleCallback( 'analytics-4' ),
			{ registry }
		);

		expect( result.current ).toBeInstanceOf( Function );

		fetchMock.postOnce(
			RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
			{ body: { success: true } }
		);
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{ body: { needsReauthentication: false } }
		);

		expect(
			registry
				.select( CORE_MODULES )
				.isDoingSetModuleActivation( 'analytics-4' )
		).toBe( false );

		await result.current();

		expect(
			registry
				.select( CORE_MODULES )
				.isDoingSetModuleActivation( 'analytics-4' )
		).toBe( true );
	} );

	it( 'should track an event and navigate to the module reauthentication URL when when module activation succeeds', async () => {
		mockTrackEvent.mockClear();

		const { result } = renderHook(
			() => useActivateModuleCallback( 'analytics-4' ),
			{ viewContext: VIEW_CONTEXT_MAIN_DASHBOARD, registry }
		);

		fetchMock.postOnce(
			RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
			{ body: { success: true } }
		);
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{ body: { needsReauthentication: false } }
		);

		expect( mockTrackEvent ).not.toHaveBeenCalled();

		await result.current();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_widget-activation-cta',
			'activate_module',
			'analytics-4'
		);

		const reauthURL = registry
			.select( MODULES_ANALYTICS_4 )
			.getAdminReauthURL();
		expect( global.location.assign ).toHaveBeenCalledWith( reauthURL );
	} );

	it( 'should set an item in storage before navigating to the module reauthentication URL', async () => {
		const { result } = renderHook(
			() => useActivateModuleCallback( 'analytics-4' ),
			{ registry }
		);

		expect( result.current ).toBeInstanceOf( Function );

		fetchMock.postOnce(
			RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
			{ body: { success: true } }
		);
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{ body: { needsReauthentication: false } }
		);

		expect( sessionStorage.setItem ).not.toHaveBeenCalled();

		let storageItem = await getItem( 'module_setup' );

		expect( storageItem.value ).toBeUndefined();

		await result.current();

		expect( sessionStorage.setItem ).toHaveBeenCalled();

		storageItem = await getItem( 'module_setup' );

		expect( storageItem.value ).toBe( 'analytics-4' );
	} );

	it( 'should set internal error state when module activation fails', async () => {
		const { result } = renderHook(
			() => useActivateModuleCallback( 'analytics-4' ),
			{ registry }
		);

		fetchMock.postOnce(
			RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
			{ body: { message: 'This is an error' }, status: 500 }
		);

		await result.current();

		expect( console ).toHaveErrored();

		expect(
			registry
				.select( CORE_MODULES )
				.isDoingSetModuleActivation( 'analytics-4' )
		).toBe( false );

		expect( registry.select( CORE_SITE ).getInternalServerError() ).toEqual(
			expect.objectContaining( {
				id: 'analytics-4-setup-error',
				description: 'This is an error',
			} )
		);
	} );

	it( 'should return null when the specified module does not exist', () => {
		const { result } = renderHook(
			() => useActivateModuleCallback( 'not-a-module' ),
			{ registry }
		);

		expect( result.current ).toBeNull();
	} );

	it( 'should return null when the specified module has no name', () => {
		const { result } = renderHook(
			() => useActivateModuleCallback( 'module-with-no-name' ),
			{ registry }
		);

		expect( result.current ).toBeNull();
	} );

	it( 'should return null when the user cannot manage options', () => {
		registry.dispatch( CORE_USER ).receiveCapabilities( {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { result } = renderHook(
			() => useActivateModuleCallback( 'analytics-4' ),
			{ registry }
		);

		expect( result.current ).toBeNull();
	} );
} );
