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
import { CORE_SITE } from './constants';

describe( 'modules/ads woocommerce', () => {
	const baseInfoVar = '_googlesitekitBaseData';
	const baseInfo = {
		woocommerce: {
			active: false,
			installed: true,
		},
		googleForWooCommerce: {
			active: false,
			installed: false,
			adsConnected: false,
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
			[ 'isWooCommerceActive', 'woocommerce', false ],
			[ 'isGoogleForWooCommercePresent', 'googleForWooCommerce', false ],
			[
				'isGoogleForWooCommerceAdsAccountLinked',
				'googleForWooCommerce',
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

				expect( siteInfo ).toHaveProperty( pluginKey );
				expect( selectorValue ).toEqual( value );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseInfoVar ];

				const result = registry.select( CORE_SITE )[ selector ]();

				await untilResolved( registry, CORE_SITE ).getSiteInfo();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'shouldShowWooCommerceRedirectModal', () => {
			it( 'uses a resolver to load module data, then returns true if modal should be shown', async () => {
				global[ baseInfoVar ] = {
					woocommerce: {
						active: true,
						installed: true,
					},
					googleForWooCommerce: {
						active: true,
						installed: true,
						adsConnected: false,
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

			it( 'uses a resolver to load module data, then returns false if modal should not be shown', async () => {
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
	} );
} );
