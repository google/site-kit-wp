/**
 * Reader Revenue Manager express setup `useExpressSetupScopes` hook tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { Registry } from '@/js/googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideUserAuthentication,
	renderHook,
} from '@tests/js/test-utils';
import useExpressSetupScopes from './useExpressSetupScopes';

describe( 'useExpressSetupScopes', () => {
	mockLocation();
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		global.location.href = 'http://example.com/?expressSetup=true';
		provideUserAuthentication( registry );
	} );

	it.each( [
		[ 'default scopes', [], [], EXPRESS_SETUP_SCOPES ],
		[
			'additional scopes',
			[ 'extra-scope' ],
			[],
			[ ...EXPRESS_SETUP_SCOPES, 'extra-scope' ],
		],
		[
			'only missing scopes',
			[],
			[ EXPRESS_SETUP_SCOPES[ 0 ] ],
			[ EXPRESS_SETUP_SCOPES[ 1 ] ],
		],
		[
			'deduplicated scopes',
			EXPRESS_SETUP_SCOPES,
			[],
			EXPRESS_SETUP_SCOPES,
		],
	] )(
		'should request %s once',
		( _, additionalScopes, grantedScopes, expectedScopes ) => {
			provideUserAuthentication( registry, { grantedScopes } );
			const dispatch = jest.spyOn(
				registry.dispatch( CORE_USER ),
				'setPermissionScopeError'
			);
			const { rerender } = renderHook(
				() => useExpressSetupScopes( additionalScopes ),
				{ registry }
			);
			rerender();

			expect( dispatch ).toHaveBeenCalledTimes( 1 );
			expect(
				registry.select( CORE_USER ).getPermissionScopeError()
			).toMatchObject( {
				data: {
					scopes: expectedScopes,
					skipModal: true,
					redirectURL: global.location.href,
				},
			} );
			expect(
				registry.select( CORE_USER ).getPermissionScopeError().data
			).not.toHaveProperty( 'errorRedirectURL' );
		}
	);

	it( 'should not request scopes that are already granted', () => {
		provideUserAuthentication( registry, {
			grantedScopes: EXPRESS_SETUP_SCOPES,
		} );
		renderHook( () => useExpressSetupScopes(), {
			registry,
		} );
		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();
	} );

	it( 'should wait for authentication to resolve before requesting scopes', () => {
		registry = createTestRegistry() as Registry;
		freezeFetch(
			/^\/google-site-kit\/v1\/core\/user\/data\/authentication/
		);
		renderHook( () => useExpressSetupScopes(), {
			registry,
		} );
		expect(
			registry.select( CORE_USER ).getPermissionScopeError()
		).toBeNull();
	} );
} );
