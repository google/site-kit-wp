/**
 * `googlesitekit/modules` datastore: changes tests.
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
	let moduleCanSubmitChanges = false;
	let submittingChanges = false;

	beforeAll( () => {
	} );

	beforeEach( () => {
		const storeDefinition = Modules.createModuleStore( moduleStoreName );
		const submitChanges = jest.fn();
		const canSubmitChanges = () => moduleCanSubmitChanges;
		const isDoingSubmitChanges = () => {
			return submittingChanges;
		};

		registry = createTestRegistry();
		registry.registerStore( moduleStoreName, Data.combineStores(
			storeDefinition,
			{
				actions: {
					submitChanges,
				},
				selectors: {
					canSubmitChanges,
					isDoingSubmitChanges,
				},
			}
		) );
	} );

	afterAll( () => {
	} );

	afterEach( () => {
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'is submitting changes', async () => {
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( nonExistentModuleSlug ) ).toBe( false );

				// @TODO  select( `modules/${ slug }` ) returns false when called via the test
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( moduleStoreName ) ).toBe( false );
				submittingChanges = true;
				expect( registry.select( STORE_NAME ).isDoingSubmitChanges( moduleStoreName ) ).toBe( true );
			} );
		} );

		describe( 'submits changes', () => {
			it( 'can submit changes', () => {
				expect( registry.select( STORE_NAME ).canSubmitChanges( slug ) ).toBe( false );
				moduleCanSubmitChanges = true;
				expect( registry.select( STORE_NAME ).canSubmitChanges( slug ) ).toBe( true );
				expect( registry.select( STORE_NAME ).canSubmitChanges( nonExistentModuleSlug ) ).toBe( false );
			} );

			it( 'does submit changes', async () => {
				const expectedError = { error: `'modules/${ nonExistentModuleSlug }' does not have a submitChanges() action.` };

				expect( await registry.dispatch( STORE_NAME ).submitChanges( nonExistentModuleSlug ) ).toEqual( expectedError );
				expect( await registry.dispatch( STORE_NAME ).submitChanges( slug ) ).toBeTruthy();
			} );
		} );
	} );
} );
