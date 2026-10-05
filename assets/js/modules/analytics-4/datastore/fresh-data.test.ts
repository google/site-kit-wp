/**
 * `modules/analytics-4` data store: fresh data tests.
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
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	setEnabledFeatures,
	untilResolved,
} from '@tests/js/test-utils';
import {
	FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS,
	MODULES_ANALYTICS_4,
} from './constants';

const analytics4SettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);

describe( 'modules/analytics-4 fresh data', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'shouldIncludeWooCommerceProducts', () => {
		function receiveState( {
			analyticsConnected = true,
			wooCommerceActive = true,
			setting = true,
		}: {
			analyticsConnected?: boolean;
			wooCommerceActive?: boolean;
			setting?: boolean;
		} = {} ) {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: analyticsConnected,
				},
			] );

			provideSiteInfo( registry, { wooCommerceActive } );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: setting,
			} );
		}

		it( 'should return true when the flag is enabled, Analytics is connected, WooCommerce is active, and the setting is on', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState();

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( true );
		} );

		it( 'should return false when the freshData flag is disabled', () => {
			receiveState();

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when Analytics is not connected', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { analyticsConnected: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when WooCommerce is installed but not active', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { wooCommerceActive: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return false when the setting is off', () => {
			setEnabledFeatures( [ 'freshData' ] );

			receiveState( { setting: false } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBe( false );
		} );

		it( 'should return undefined while WooCommerce activation status is unresolved', () => {
			setEnabledFeatures( [ 'freshData' ] );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				[ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true,
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBeUndefined();
		} );

		it( 'should return undefined while the setting is unresolved', async () => {
			setEnabledFeatures( [ 'freshData' ] );

			fetchMock.getOnce( analytics4SettingsEndpoint, {
				body: { [ FRESH_DATA_INCLUDES_WOOCOMMERCE_PRODUCTS ]: true },
				status: 200,
			} );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			provideSiteInfo( registry, { wooCommerceActive: true } );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeWooCommerceProducts()
			).toBeUndefined();

			await untilResolved( registry, MODULES_ANALYTICS_4 ).getSettings();
		} );
	} );
} );
