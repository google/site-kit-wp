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
				installed: false,
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
			[ 'isWooCommerceInstalled', PLUGINS.WOOCOMMERCE, false ],
			[ 'isWooCommerceActivated', PLUGINS.WOOCOMMERCE, false ],
			[
				'isGoogleForWooCommerceInstalled',
				PLUGINS.GOOGLE_FOR_WOOCOMMERCE,
				false,
			],
			[
				'hasGoogleForWooCommerceAdsAccount',
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
	} );
} );
