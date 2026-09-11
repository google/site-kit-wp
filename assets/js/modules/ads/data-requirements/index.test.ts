/**
 * Ads module data requirements tests.
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
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import { createTestRegistry } from '@tests/js/test-utils';
import {
	requireGoogleForWooCommerceActivated,
	requireGoogleForWooCommerceAdsAccount,
	requireNoGoogleForWooCommerceAdsAccount,
	requireWooCommerceActivated,
} from './index';

describe( 'ads data requirements', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	function providePlugins( plugins: Record< string, unknown > ) {
		registry.dispatch( MODULES_ADS ).receiveModuleData( { plugins } );
	}

	describe( 'requireWooCommerceActivated', () => {
		it( 'should return true when WooCommerce is activated', async () => {
			providePlugins( { [ PLUGINS.WOOCOMMERCE ]: { active: true } } );

			await expect(
				requireWooCommerceActivated()( registry )
			).resolves.toBe( true );
		} );

		it( 'should return false when WooCommerce is not activated', async () => {
			providePlugins( { [ PLUGINS.WOOCOMMERCE ]: { active: false } } );

			await expect(
				requireWooCommerceActivated()( registry )
			).resolves.toBe( false );
		} );

		it( 'should return false when the plugin status is not available', async () => {
			providePlugins( {} );

			await expect(
				requireWooCommerceActivated()( registry )
			).resolves.toBe( false );
		} );
	} );

	describe( 'requireGoogleForWooCommerceActivated', () => {
		it( 'should return true when Google for WooCommerce is activated', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { active: true },
			} );

			await expect(
				requireGoogleForWooCommerceActivated()( registry )
			).resolves.toBe( true );
		} );

		it( 'should return false when Google for WooCommerce is not activated', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { active: false },
			} );

			await expect(
				requireGoogleForWooCommerceActivated()( registry )
			).resolves.toBe( false );
		} );

		it( 'should return false when the plugin status is not available', async () => {
			providePlugins( {} );

			await expect(
				requireGoogleForWooCommerceActivated()( registry )
			).resolves.toBe( false );
		} );
	} );

	describe( 'requireGoogleForWooCommerceAdsAccount', () => {
		it( 'should return true when a Google for WooCommerce Ads account is linked', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { adsConnected: true },
			} );

			await expect(
				requireGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( true );
		} );

		it( 'should return false when no Google for WooCommerce Ads account is linked', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { adsConnected: false },
			} );

			await expect(
				requireGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( false );
		} );

		it( 'should return false when the account status is not available', async () => {
			providePlugins( {} );

			await expect(
				requireGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( false );
		} );
	} );

	describe( 'requireNoGoogleForWooCommerceAdsAccount', () => {
		it( 'should return true when no Google for WooCommerce Ads account is linked', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { adsConnected: false },
			} );

			await expect(
				requireNoGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( true );
		} );

		it( 'should return false when a Google for WooCommerce Ads account is linked', async () => {
			providePlugins( {
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: { adsConnected: true },
			} );

			await expect(
				requireNoGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( false );
		} );

		it( 'should return false when the account status is not available', async () => {
			providePlugins( {} );

			await expect(
				requireNoGoogleForWooCommerceAdsAccount()( registry )
			).resolves.toBe( false );
		} );
	} );
} );
