/**
 * `googlesitekit/modules` datastore: settings tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Modules from 'googlesitekit-modules';
import { CORE_MODULES } from './constants';
import {
	createTestRegistry,
	provideModules,
	subscribeUntil,
} from '../../../../../tests/js/utils';

describe( 'core/modules settings', () => {
	let registry;
	let submitChanges;
	const slug = 'test-module';
	const nonExistentModuleSlug = 'not-module';
	const moduleStoreName = `test/${ slug }`;
	const testReturnValue = 'placeholder_return_value';
	let validateCanSubmitChangesError = false;

	beforeEach( () => {
		submitChanges = jest.fn();

		registry = createTestRegistry();

		registry.registerStore(
			moduleStoreName,
			Modules.createModuleStore( slug, {
				storeName: moduleStoreName,
				submitChanges,
				validateCanSubmitChanges: () => {
					if ( validateCanSubmitChangesError ) {
						throw new Error( validateCanSubmitChangesError );
					}
				},
				settingSlugs: [ 'testSetting' ],
			} )
		);

		registry
			.dispatch( CORE_MODULES )
			.registerModule( slug, { storeName: moduleStoreName } );

		provideModules( registry );
	} );

	describe( 'actions', () => {
		describe( 'submitChanges', () => {
			it( 'should return an error if a module doesnt exist', async () => {
				const expectedError = {
					error: `The module '${ nonExistentModuleSlug }' does not have a store.`,
				};
				expect(
					await registry
						.dispatch( CORE_MODULES )
						.submitChanges( nonExistentModuleSlug )
				).toEqual( expectedError );
			} );

			it( 'should proxy the dispatched action to the module with the given slug', async () => {
				submitChanges.mockImplementation( () => testReturnValue );
				expect(
					await registry
						.dispatch( CORE_MODULES )
						.submitChanges( slug )
				).toBe( testReturnValue );
			} );

			it( 'should throw an error if submitChanges has been called without a module slug', () => {
				expect( () => {
					registry.dispatch( CORE_MODULES ).submitChanges();
				} ).toThrow();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'should return FALSE for non existing module', () => {
				expect(
					registry
						.select( CORE_MODULES )
						.isDoingSubmitChanges( nonExistentModuleSlug )
				).toBe( false );
			} );

			it( 'should proxy the selector call to the module with the given slug', async () => {
				// Check isDoingSubmitChanges is true while submitChanges is being performed
				let checkIsDoingSubmitChanges;
				submitChanges.mockImplementation( ( { select } ) => {
					checkIsDoingSubmitChanges =
						select( CORE_MODULES ).isDoingSubmitChanges( slug );
				} );
				await registry.dispatch( CORE_MODULES ).submitChanges( slug );
				expect( checkIsDoingSubmitChanges ).toBe( true );

				// Check that isDoingSubmitChanges returns to false once changes are saved.
				expect(
					registry.select( CORE_MODULES ).isDoingSubmitChanges( slug )
				).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'should return FALSE for non existing module', () => {
				expect(
					registry
						.select( CORE_MODULES )
						.canSubmitChanges( nonExistentModuleSlug )
				).toBe( false );
			} );

			it( 'should proxy the selector call to the module with the given slug', () => {
				expect(
					registry.select( CORE_MODULES ).canSubmitChanges( slug )
				).toBe( true );
				validateCanSubmitChangesError = 'error message';
				expect(
					registry.select( CORE_MODULES ).canSubmitChanges( slug )
				).toBe( false );
			} );
		} );

		describe( 'haveSettingsChanged', () => {
			it( 'should return FALSE for non existent module', () => {
				expect(
					registry
						.select( CORE_MODULES )
						.haveSettingsChanged( nonExistentModuleSlug )
				).toBe( false );
			} );

			it( 'should return true when module setting have changed', async () => {
				expect(
					registry.select( CORE_MODULES ).haveSettingsChanged( slug )
				).toBe( false );
				const serverValues = { testSetting: 'serverside' };
				const clientValues = { testSetting: 'clientside' };

				const select = registry.select( moduleStoreName );
				const dispatch = registry.dispatch( moduleStoreName );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/test-module/data/settings'
					),
					{ body: serverValues, status: 200 }
				);

				select.getSettings();
				await subscribeUntil(
					registry,
					() => select.getSettings() !== undefined
				);

				// Still false after fetching settings from server.
				expect( select.haveSettingsChanged() ).toEqual( false );

				// True after updating settings on client.
				dispatch.setSettings( clientValues );
				expect( select.haveSettingsChanged() ).toEqual( true );

				// False after updating settings back to original server value on client.
				dispatch.setSettings( serverValues );
				expect( select.haveSettingsChanged() ).toEqual( false );
			} );
		} );
	} );
} );
