/**
 * Tests for the useIsSiteGoalsBreakdownEnabled hook.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideUserCapabilities,
	renderHook,
} from '@tests/js/test-utils';
import { useIsSiteGoalsBreakdownEnabled } from './useIsSiteGoalsBreakdownEnabled';

describe( 'useIsSiteGoalsBreakdownEnabled', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserCapabilities( registry );
	} );

	it( 'is enabled when the dimensions exist and conversion tracking is on', () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: true } );

		const { result } = renderHook(
			() => useIsSiteGoalsBreakdownEnabled( true ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );

	it( 'is not enabled when the dimensions exist but conversion tracking is off', () => {
		registry
			.dispatch( CORE_SITE )
			.receiveGetConversionTrackingSettings( { enabled: false } );

		const { result } = renderHook(
			() => useIsSiteGoalsBreakdownEnabled( true ),
			{ registry }
		);

		expect( result.current ).toBe( false );
	} );

	it( 'reads undefined while the conversion tracking setting is loading', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/core/site/data/conversion-tracking'
			)
		);

		const { result } = renderHook(
			() => useIsSiteGoalsBreakdownEnabled( true ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'follows the dimensions alone for a user who cannot read the setting', () => {
		provideUserCapabilities( registry, {
			googlesitekit_manage_options: false,
		} );

		const { result } = renderHook(
			() => useIsSiteGoalsBreakdownEnabled( true ),
			{ registry }
		);

		expect( result.current ).toBe( true );
	} );
} );
