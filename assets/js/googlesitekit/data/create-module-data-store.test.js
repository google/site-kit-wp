/**
 * Provides API functions to create a datastore for module inline data.
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
import { createTestRegistry, untilResolved } from '../../../../tests/js/utils';
import { createModuleDataStore } from './create-module-data-store';
import { camelCaseToPascalCase } from './transform-case';

const MODULE_SLUG = 'test-module';
const STORE_NAME = `modules/${ MODULE_SLUG }`;

describe( 'createModuleDataStore store', () => {
	const baseModulesGlobalName = '_googlesitekitModulesData';
	const inlineData = {
		dataProp1: 'test-string',
		dataProp2: false,
	};
	const baseData = {
		[ MODULE_SLUG ]: inlineData,
	};

	let registry;
	let storeDefinition;
	let store;

	beforeEach( () => {
		global[ baseModulesGlobalName ] = baseData;
		registry = createTestRegistry();

		storeDefinition = createModuleDataStore( {
			moduleSlug: MODULE_SLUG,
			storeName: STORE_NAME,
			inlineDataProperties: Object.keys( inlineData ),
		} );

		registry.registerStore( STORE_NAME, storeDefinition );

		store = registry.stores[ STORE_NAME ].store;
	} );

	afterEach( () => {
		delete global[ baseModulesGlobalName ];
	} );

	describe( 'name', () => {
		it( 'returns the correct default store name', () => {
			expect( storeDefinition.STORE_NAME ).toEqual( STORE_NAME );
		} );
	} );

	describe( 'actions', () => {
		describe( 'receiveModuleData', () => {
			it( 'requires the data param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveModuleData();
				} ).toThrow( 'data is required.' );
			} );

			it( 'receives module data', async () => {
				await registry
					.dispatch( STORE_NAME )
					.receiveModuleData( baseData[ MODULE_SLUG ] );

				expect( store.getState().moduleData ).toMatchObject(
					baseData[ MODULE_SLUG ]
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

				registry.select( STORE_NAME ).getModuleData();

				await untilResolved( registry, STORE_NAME ).getModuleData();

				const moduleData = registry
					.select( STORE_NAME )
					.getModuleData();

				expect( moduleData ).toMatchObject( baseData[ MODULE_SLUG ] );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ baseModulesGlobalName ] ).not.toEqual(
					undefined
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				delete global[ baseModulesGlobalName ];

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const moduleData = registry
					.select( STORE_NAME )
					.getModuleData();

				await untilResolved( registry, STORE_NAME ).getModuleData();

				const initialValue = {};
				Object.keys( inlineData ).forEach(
					( property ) => ( initialValue[ property ] = undefined )
				);

				expect( moduleData ).toMatchObject( initialValue );
			} );
		} );

		it( 'has the correct selector name', () => {
			expect( Object.keys( storeDefinition.selectors ) ).toEqual(
				// "isSkyBlue" should turn into "getIsSkyBlue".
				expect.arrayContaining(
					Object.keys( inlineData ).map(
						( property ) =>
							`get${ camelCaseToPascalCase( property ) }`
					)
				)
			);
		} );

		describe.each(
			Object.keys( inlineData ).map( ( property ) => [
				`get${ camelCaseToPascalCase( property ) }`,
				property,
			] )
		)( '%s', ( selector, moduleDataKey ) => {
			it( 'uses a resolver to load module data then returns the data when this specific selector is used', async () => {
				registry.select( STORE_NAME )[ selector ]();

				await untilResolved( registry, STORE_NAME ).getModuleData();

				const moduleData = registry
					.select( STORE_NAME )
					.getModuleData();

				expect( moduleData ).toHaveProperty( moduleDataKey );
				expect( moduleData[ moduleDataKey ] ).toEqual(
					baseData[ MODULE_SLUG ][ moduleDataKey ]
				);
			} );

			it( 'returns correct data when module data is available', async () => {
				await registry
					.dispatch( STORE_NAME )
					.receiveModuleData( baseData[ MODULE_SLUG ] );

				registry.select( STORE_NAME )[ selector ]();

				const selectorValue = registry
					.select( STORE_NAME )
					[ selector ]();

				expect( selectorValue ).toEqual(
					baseData[ MODULE_SLUG ][ moduleDataKey ]
				);
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				global[ baseModulesGlobalName ] = undefined;

				expect( global[ baseModulesGlobalName ] ).toEqual( undefined );

				const result = registry.select( STORE_NAME )[ selector ]();

				await untilResolved( registry, STORE_NAME ).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );
	} );
} );
