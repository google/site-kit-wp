/**
 * `useCompleteModuleActivationCallback` hook tests.
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
	actHook as act,
} from '../../../tests/js/test-utils';
import { mockLocation } from '../../../tests/js/mock-browser-utils';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '../googlesitekit/datastore/user/constants';
import useCompleteModuleActivationCallback from './useCompleteModuleActivationCallback';

describe( 'useCompleteModuleActivationCallback', () => {
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

	it( 'should navigate to the module reauthentication URL', async () => {
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{ body: { needsReauthentication: false } }
		);

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useCompleteModuleActivationCallback( 'analytics' ),
				{ registry }
			) );
		} );

		await result.current();

		expect( global.location.assign ).toHaveBeenCalledWith(
			'http://example.com/wp-admin/admin.php?page=googlesitekit-module-analytics&slug=analytics&reAuth=true'
		);
	} );

	it( 'should return null when the specified module does not exist', () => {
		const { result } = renderHook(
			() => useCompleteModuleActivationCallback( 'not-a-module' ),
			{ registry }
		);

		expect( result.current ).toBeNull();
	} );

	it( 'should return null when the specified module has no name', () => {
		const { result } = renderHook(
			() => useCompleteModuleActivationCallback( 'module-with-no-name' ),
			{ registry }
		);

		expect( result.current ).toBeNull();
	} );

	it( 'should return null when the user cannot manage options', async () => {
		fetchMock.getOnce(
			RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{ body: { needsReauthentication: false } }
		);

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useCompleteModuleActivationCallback( 'analytics' ),
				{ registry }
			) );
		} );

		expect( result.current ).toBeNull();
	} );
} );
