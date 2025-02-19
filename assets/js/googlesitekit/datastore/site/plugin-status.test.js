/**
 * `modules/ads` woocommerce store tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_SITE, PLUGINS } from './constants';

describe( 'core/site plugin status', () => {
	const baseInfoVar = '_googlesitekitBaseData';
	const baseInfo = {
		adminURL: 'http://something.test/wp-admin',
		plugins: {
			wooCommerce: {
				active: false,
				installed: true,
			},
			googleForWooCommerce: {
				active: false,
				installed: false,
				adsConnected: false,
			},
		},
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		global[ baseInfoVar ] = baseInfo;
	} );

	afterEach( () => {
		delete global[ baseInfoVar ];
	} );

	describe( 'selectors', () => {
		describe.each( [
			[ 'isWooCommerceActive', PLUGINS.WOOCOMMERCE, false ],
			[
				'isGoogleForWooCommercePresent',
				PLUGINS.GOOGLE_FOR_WOOCOMMERCE,
				false,
			],
			[
				'isGoogleForWooCommerceAdsAccountLinked',
				PLUGINS.GOOGLE_FOR_WOOCOMMERCE,
				false,
			],
		] )( '%s', ( selector, pluginKey, value ) => {
			it( 'uses a resolver to load plugin status then returns the status value when this specific selector is used', async () => {
				registry.select( CORE_SITE )[ selector ]();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				const siteInfo = registry.select( CORE_SITE ).getSiteInfo();

				const selectorValue = registry
					.select( CORE_SITE )
					[ selector ]();

				expect( siteInfo ).toHaveProperty( 'plugins' );
				expect( siteInfo.plugins ).toHaveProperty( pluginKey );
				expect( selectorValue ).toEqual( value );
			} );

			it( 'will return initial state (undefined) when site info is not available', async () => {
				delete global[ baseInfoVar ];

				const result = registry.select( CORE_SITE )[ selector ]();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'shouldShowWooCommerceRedirectModal', () => {
			it( 'uses a resolver to load site info, then returns true if modal should be shown', async () => {
				global[ baseInfoVar ] = {
					plugins: {
						wooCommerce: {
							active: true,
							installed: true,
						},
						googleForWooCommerce: {
							active: true,
							installed: true,
							adsConnected: false,
						},
					},
				};

				registry
					.select( CORE_SITE )
					.shouldShowWooCommerceRedirectModal();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				const shouldShowWooCommerceRedirectModal = registry
					.select( CORE_SITE )
					.shouldShowWooCommerceRedirectModal();

				expect( shouldShowWooCommerceRedirectModal ).toEqual( true );
			} );

			it( 'uses a resolver to load site info, then returns false if modal should not be shown', async () => {
				registry
					.select( CORE_SITE )
					.shouldShowWooCommerceRedirectModal();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				const shouldShowWooCommerceRedirectModal = registry
					.select( CORE_SITE )
					.shouldShowWooCommerceRedirectModal();

				expect( shouldShowWooCommerceRedirectModal ).toEqual( false );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseInfoVar ];

				expect( global[ baseInfoVar ] ).toEqual( undefined );

				const result = registry
					.select( CORE_SITE )
					.shouldShowWooCommerceRedirectModal();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getGoogleForWooCommerceRedirectURI', () => {
			it( 'uses a resolver to load site info, then returns the correct URL when WooCommerce is active but Google for WooCommerce is not', async () => {
				global[ baseInfoVar ] = {
					...baseInfo,
					plugins: {
						wooCommerce: {
							active: true,
							installed: true,
						},
						googleForWooCommerce: {
							active: false,
							installed: false,
							adsConnected: false,
						},
					},
				};

				registry
					.select( CORE_SITE )
					.getGoogleForWooCommerceRedirectURI();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				const googleForWooCommerceRedirectURI = registry
					.select( CORE_SITE )
					.getGoogleForWooCommerceRedirectURI();

				expect( googleForWooCommerceRedirectURI ).toEqual(
					`${ baseInfo.adminURL }/plugin-install.php?s=google-listings-and-ads&tab=search&type=term`
				);
			} );

			it( 'uses a resolver to load site info, then returns the correct URL when both WooCommerce and Google for WooCommerce are active', async () => {
				global[ baseInfoVar ] = {
					...baseInfo,
					plugins: {
						wooCommerce: {
							active: true,
							installed: true,
						},
						googleForWooCommerce: {
							active: true,
							installed: true,
							adsConnected: false,
						},
					},
				};

				registry
					.select( CORE_SITE )
					.getGoogleForWooCommerceRedirectURI();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				const googleForWooCommerceRedirectURI = registry
					.select( CORE_SITE )
					.getGoogleForWooCommerceRedirectURI();

				expect( googleForWooCommerceRedirectURI ).toEqual(
					`${
						baseInfo.adminURL
					}/admin.php?page=wc-admin&path=${ encodeURIComponent(
						'/google/dashboard'
					) }`
				);
			} );

			it( 'will return initial state (undefined) when no site info is available', async () => {
				delete global[ baseInfoVar ];

				expect( global[ baseInfoVar ] ).toEqual( undefined );

				const result = registry
					.select( CORE_SITE )
					.getGoogleForWooCommerceRedirectURI();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
