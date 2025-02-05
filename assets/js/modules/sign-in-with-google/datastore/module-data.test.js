/**
 * `modules/sign-in-with-google` data store: module-data tests.
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
import { initialState } from './index';
import { MODULES_SIGN_IN_WITH_GOOGLE } from './constants';

describe( 'modules/sign-in-with-google inline module data', () => {
	const baseModulesGlobalName = '_googlesitekitModulesData';
	const baseData = {
		'sign-in-with-google': {
			isWooCommerceActive: false,
			isWooCommerceRegistrationEnabled: false,
		},
	};

	let registry;
	let store;

	beforeEach( () => {
		global[ baseModulesGlobalName ] = baseData;
		registry = createTestRegistry();
		store = registry.stores[ MODULES_SIGN_IN_WITH_GOOGLE ].store;
	} );

	afterEach( () => {
		delete global[ baseModulesGlobalName ];
	} );

	describe( 'actions', () => {
		describe( 'receiveModuleData', () => {
			it( 'requires the moduleData param', () => {
				expect( () => {
					registry
						.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
						.receiveModuleData();
				} ).toThrow( 'moduleData is required.' );
			} );

			it( 'receives module data', async () => {
				await registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.receiveModuleData( baseData[ 'sign-in-with-google' ] );

				expect( store.getState().moduleData ).toMatchObject(
					baseData[ 'sign-in-with-google' ]
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleData', () => {
			it( 'uses a resolver to load module data from a global variable by default, and does not delete that global variable after consumption', async () => {
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);

				registry.select( MODULES_SIGN_IN_WITH_GOOGLE ).getModuleData();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getModuleData();

				const moduleData = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getModuleData();

				expect( moduleData ).toMatchObject(
					baseData[ 'sign-in-with-google' ]
				);

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const moduleData = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getModuleData();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getModuleData();

				expect( moduleData ).toBe( initialState.moduleData );
				expect( moduleData.isWooCommerceActive ).toBe( undefined );
			} );
		} );

		describe.each( [
			[ 'getIsWooCommerceActive', 'isWooCommerceActive' ],
			[
				'getIsWooCommerceRegistrationEnabled',
				'isWooCommerceRegistrationEnabled',
			],
		] )( '%s', ( selector, moduleDataKey ) => {
			it( 'uses a resolver to load module data then returns the data when this specific selector is used', async () => {
				registry.select( MODULES_SIGN_IN_WITH_GOOGLE )[ selector ]();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getModuleData();

				const moduleData = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					.getModuleData();

				expect( moduleData ).toHaveProperty( moduleDataKey );
				expect( moduleData[ moduleDataKey ] ).toEqual(
					baseData[ 'sign-in-with-google' ][ moduleDataKey ]
				);
			} );

			it( 'returns correct data when module data is available', async () => {
				await registry
					.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
					.receiveModuleData( baseData[ 'sign-in-with-google' ] );

				registry.select( MODULES_SIGN_IN_WITH_GOOGLE )[ selector ]();

				const selectorValue = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					[ selector ]();

				expect( selectorValue ).toEqual(
					baseData[ 'sign-in-with-google' ][ moduleDataKey ]
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				global[ baseModulesGlobalName ] = undefined;

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const result = registry
					.select( MODULES_SIGN_IN_WITH_GOOGLE )
					[ selector ]();

				await untilResolved(
					registry,
					MODULES_SIGN_IN_WITH_GOOGLE
				).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );
