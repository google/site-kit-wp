/**
 * `googlesitekit/modules` datastore: settings tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import Modules from 'googlesitekit-modules';
import { STORE_NAME } from './constants';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules store changes', () => {
	let registry;
	const slug = 'test-module';
	const nonExistentModuleSlug = 'not-module';
	const moduleStoreName = `modules/${ slug }`;
	const controlReturn = 'dummy_return_value';
	const DUMMY_ACTION = 'DUMMY_ACTION';
	let moduleCanSubmitChanges = false;
	let submittingChanges = false;

	beforeEach( () => {
		const storeDefinition = Modules.createModuleStore( moduleStoreName );
		const canSubmitChanges = () => moduleCanSubmitChanges;
		const isDoingSubmitChanges = () => {
			return submittingChanges;
		};

		registry = createTestRegistry();
		registry.registerStore( moduleStoreName, Data.combineStores(
			storeDefinition,
			{
				actions: {
					*submitChanges() {
						const result = yield {
							payload: {},
							type: DUMMY_ACTION,
						};
						return result;
					},
				},
				selectors: {
					canSubmitChanges,
					isDoingSubmitChanges,
				},
				controls: {
					[ DUMMY_ACTION ]: () => controlReturn,
				},
			}
		) );
	} );

	describe( 'actions', () => {
		it( 'it proxies the selector call to the module with the given slug', async () => {
			const expectedError = { error: `'modules/${ nonExistentModuleSlug }' does not have a submitChanges() action.` };
			expect( await registry.dispatch( STORE_NAME ).submitChanges( nonExistentModuleSlug ) ).toEqual( expectedError );

			expect( await registry.dispatch( STORE_NAME ).submitChanges( nonExistentModuleSlug ) ).toEqual( expectedError );

			const expectedErrorNoSlug = { error: "'modules/' does not have a submitChanges() action." };
			expect( await registry.dispatch( STORE_NAME ).submitChanges() ).toEqual( expectedErrorNoSlug );

			expect( await registry.dispatch( STORE_NAME ).submitChanges( slug ) ).toBe( controlReturn );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'it proxies the selector call to the module with the given slug', async () => {
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( nonExistentModuleSlug ) ).toBe( false );

				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( slug ) ).toBe( false );
				submittingChanges = true;
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( slug ) ).toBe( true );
			} );
		} );
		describe( 'canSubmitChanges', () => {
			it( 'it proxies the selector call to the module with the given slug', () => {
				expect( registry.select( STORE_NAME ).canSubmitChanges( slug ) ).toBe( false );
				moduleCanSubmitChanges = true;
				expect( registry.select( STORE_NAME ).canSubmitChanges( slug ) ).toBe( true );

				expect( registry.select( STORE_NAME ).canSubmitChanges( nonExistentModuleSlug ) ).toBe( false );
			} );
		} );
	} );
} );
