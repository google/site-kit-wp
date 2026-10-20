/**
 * Tests for the useConversionTrackingSetting hook.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { PERMISSION_MANAGE_OPTIONS } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideUserCapabilities,
	renderHook,
} from '@tests/js/test-utils';
import { useConversionTrackingSetting } from './useConversionTrackingSetting';

describe( 'useConversionTrackingSetting', () => {
	let registry: WPDataRegistry;

	const conversionTrackingEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/conversion-tracking'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it.each( [ true, false ] )(
		'returns the setting for a user who can manage options, when conversion tracking is %s',
		( enabled ) => {
			provideUserCapabilities( registry );
			registry
				.dispatch( CORE_SITE )
				.receiveGetConversionTrackingSettings( { enabled } );

			const { result } = renderHook(
				() => useConversionTrackingSetting(),
				{ registry }
			);

			expect( result.current ).toEqual( {
				canManageOptions: true,
				isConversionTrackingEnabled: enabled,
			} );
		}
	);

	it( 'reports the setting as loading while it is requested for a user who can manage options', async () => {
		provideUserCapabilities( registry );
		freezeFetch( conversionTrackingEndpoint );

		const { result, waitForRegistry } = renderHook(
			() => useConversionTrackingSetting(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.isConversionTrackingEnabled ).toBeUndefined();
		expect( fetchMock ).toHaveFetched( conversionTrackingEndpoint );
	} );

	it( 'does not request the setting for a user who cannot manage options', async () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_MANAGE_OPTIONS ]: false,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useConversionTrackingSetting(),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current ).toEqual( {
			canManageOptions: false,
			isConversionTrackingEnabled: undefined,
		} );
		expect( fetchMock ).not.toHaveFetched( conversionTrackingEndpoint );
	} );
} );
