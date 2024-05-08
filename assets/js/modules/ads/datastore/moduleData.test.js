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
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { initialState } from './index';
import { MODULES_ADS } from './constants';

describe( 'modules/ads module data', () => {
	const baseModulesDataVariable = '_googlesitekitModulesData';
	const baseData = {
		ads: {
			supportedConversionEvents: [ 'add-to-cart' ],
		},
	};

	let registry;

	beforeEach( () => {
		global[ baseModulesDataVariable ] = baseData;
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ baseModulesDataVariable ];
		unsubscribeFromAll( registry );
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
				expect( global[ baseModulesDataVariable ] ).not.toEqual(
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
				expect( global[ baseModulesDataVariable ] ).not.toEqual(
					undefined
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesDataVariable ];

				expect( global[ baseModulesDataVariable ] ).toEqual(
					undefined
				);

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
	} );
} );
