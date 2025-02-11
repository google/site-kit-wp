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
import { MODULES_ADS } from './constants';

describe( 'modules/ads woocommerce', () => {
	const baseModulesGlobalName = '_googlesitekitModulesData';
	const baseData = {
		ads: {
			supportedConversionEvents: [ 'add-to-cart' ],
			woocommerce: {
				active: false,
				installed: true,
			},
			googleListingsAndAds: {
				active: false,
				installed: false,
				adsLinked: false,
			},
		},
	};

	let registry;

	beforeEach( () => {
		global[ baseModulesGlobalName ] = baseData;
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ baseModulesGlobalName ];
	} );

	describe( 'selectors', () => {
		describe.each( [
			[ 'isWooCommerceActive', 'woocommerce', false ],
			[ 'isGoogleForWooCommercePresent', 'googleListingsAndAds', false ],
			[
				'isGoogleForWooCommerceAdsAccountLinked',
				'googleListingsAndAds',
				false,
			],
		] )( '%s', ( selector, pluginKey, value ) => {
			it( 'uses a resolver to load plugin status then returns the status value when this specific selector is used', async () => {
				registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				const moduleData = registry
					.select( MODULES_ADS )
					.getModuleData();

				const selectorValue = registry
					.select( MODULES_ADS )
					[ selector ]();

				expect( moduleData ).toHaveProperty( pluginKey );
				expect( selectorValue ).toEqual( value );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				const result = registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );
