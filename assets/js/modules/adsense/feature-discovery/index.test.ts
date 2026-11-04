/**
 * AdSense Feature Discovery registration tests.
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
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { createTestRegistry } from '@tests/js/utils';
import { registerFeatures } from './index';

describe( 'AdSense feature discovery registration', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should register ad blocking recovery setup with an isEnabled check from AdSense datastore', () => {
		registerFeatures( createFeatureDiscovery( registry ) );

		const adBlockingRecoveryFeature = registry
			.select( CORE_FEATURE_DISCOVERY )
			.getFeature( 'ad-blocking-recovery' );

		expect( adBlockingRecoveryFeature ).toBeDefined();
		expect( adBlockingRecoveryFeature.setup.isEnabled ).toBeInstanceOf(
			Function
		);

		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			useAdBlockingRecoverySnippet: true,
		} );

		expect(
			adBlockingRecoveryFeature.setup.isEnabled( registry.select )
		).toBe( true );
	} );
} );
