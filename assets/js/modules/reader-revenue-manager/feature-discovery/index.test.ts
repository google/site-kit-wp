/**
 * Reader Revenue Manager Feature Discovery registrations tests.
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
import { Registry } from 'googlesitekit-data';
import { enabledFeatures } from '@/js/features';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistryWithFeatures } from '@tests/js/feature-flag-utils';
import { freezeFetch, provideModules, provideSiteInfo } from '@tests/js/utils';
import { registerFeatures } from './index';

describe( 'Reader Revenue Manager feature discovery', () => {
	let registry: Registry;

	beforeEach( () => {
		// `registerFeatures()` reads this instance, not the one reloaded by
		// `createTestRegistryWithFeatures()`.
		enabledFeatures.add( 'rrmExpressSetup' );
		registry = createTestRegistryWithFeatures( [
			'rrmExpressSetup',
		] ) as Registry;
		provideSiteInfo( registry );
		registerFeatures( createFeatureDiscovery( registry ) );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'rrmExpressSetup' );
	} );

	function provideRRM( active: boolean ) {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active,
				connected: active,
			},
		] );
	}

	function isNewsletterFeatureConnected() {
		return registry
			.select( CORE_FEATURE_DISCOVERY )
			.isFeatureConnected( 'newsletter-signup' );
	}

	describe( 'newsletter-signup', () => {
		it( 'should not be registered unless the `rrmExpressSetup` feature is enabled', () => {
			enabledFeatures.delete( 'rrmExpressSetup' );
			registry = createTestRegistryWithFeatures( [] ) as Registry;
			registerFeatures( createFeatureDiscovery( registry ) );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( 'newsletter-signup' )
			).toBeNull();
		} );

		it( 'should be undefined while the settings are unresolved', () => {
			provideRRM( true );
			freezeFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
				)
			);

			expect( isNewsletterFeatureConnected() ).toBeUndefined();
		} );

		it( 'should not count as set up when RRM is connected without a newsletter sign-up form', () => {
			provideRRM( true );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { configuredCTAs: {} } );

			expect( isNewsletterFeatureConnected() ).toBe( false );
		} );

		it( 'should count as set up once a newsletter sign-up form is configured', () => {
			provideRRM( true );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					configuredCTAs: { 'cta-1': 'newsletter-signup' },
				} );

			expect( isNewsletterFeatureConnected() ).toBe( true );
		} );
	} );
} );
