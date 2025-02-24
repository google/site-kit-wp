/**
 * `modules/ads` moduleData store tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { initialState } from './index';
import { MODULES_ADS, PLUGINS } from './constants';

describe( 'modules/ads module data', () => {
	const baseModulesGlobalName = '_googlesitekitModulesData';
	const baseData = {
		ads: {
			supportedConversionEvents: [ 'add-to-cart' ],
			plugins: {
				woocommerce: {
					active: false,
					installed: false,
				},
				'google-listings-and-ads': {
					active: false,
					installed: false,
					adsConnected: false,
				},
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

	describe( 'actions', () => {
		describe( 'receiveModuleData', () => {
			it( 'requires the moduleData param', () => {
				expect( () => {
					registry.dispatch( MODULES_ADS ).receiveModuleData();
				} ).toThrow( 'moduleData is required.' );
			} );

			it( 'receives module data', async () => {
				await registry
					.dispatch( MODULES_ADS )
					.receiveModuleData( baseData );

				registry.select( MODULES_ADS ).getSupportedConversionEvents();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				const supportedConversionEvents = registry
					.select( MODULES_ADS )
					.getSupportedConversionEvents();

				expect( supportedConversionEvents ).toMatchObject( [
					'add-to-cart',
				] );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleData', () => {
			it( 'uses a resolver to load module data from a global variable by default, and does not delete that global variable after consumption', async () => {
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);

				await registry
					.dispatch( MODULES_ADS )
					.receiveModuleData( baseData );

				registry.select( MODULES_ADS ).getSupportedConversionEvents();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				const supportedConversionEvents = registry
					.select( MODULES_ADS )
					.getSupportedConversionEvents();

				expect( supportedConversionEvents ).toMatchObject( [
					'add-to-cart',
				] );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const moduleData = registry
					.select( MODULES_ADS )
					.getModuleData();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				expect( moduleData ).toBe( initialState.moduleData );
				expect( moduleData.supportedConversionEvents ).toBe(
					undefined
				);
			} );
		} );

		describe.each( [
			[ 'getSupportedConversionEvents', 'supportedConversionEvents' ],
			[ 'getPluginsData', 'plugins' ],
		] )( '%s', ( selector, dataKey ) => {
			it( 'uses a resolver to load module data then returns the data when this specific selector is used', async () => {
				registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				const moduleData = registry
					.select( MODULES_ADS )
					.getModuleData();

				expect( moduleData ).toHaveProperty( dataKey );
				expect( moduleData ).toEqual( baseData.ads );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				const result = registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );

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
			it( 'uses a resolver to load data then returns the value when this specific selector is used', async () => {
				registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				const moduleData = registry
					.select( MODULES_ADS )
					.getModuleData();

				const selectorValue = registry
					.select( MODULES_ADS )
					[ selector ]();

				expect( moduleData ).toHaveProperty( 'plugins' );
				expect( moduleData.plugins ).toHaveProperty( pluginKey );
				expect( selectorValue ).toEqual( value );
			} );

			it( 'will return initial state (undefined) when module data is not available', async () => {
				delete global[ baseModulesGlobalName ];

				const result = registry.select( MODULES_ADS )[ selector ]();

				await untilResolved( registry, MODULES_ADS ).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );
