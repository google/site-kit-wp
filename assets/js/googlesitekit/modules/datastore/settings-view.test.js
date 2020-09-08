/**
 * core/modules data store: settings-view tests.
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/modules settings-view', () => {
	let registry;
	let store;

	beforeEach( async () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	describe( 'actions', () => {
		describe( 'setSettingsViewCurrentModule', () => {
			it( 'sets the current module with the given module slug', () => {
				expect( store.getState().settingsView.currentModule ).toBe( '' );

				registry.dispatch( STORE_NAME ).setSettingsViewCurrentModule( 'test-module' );

				expect( store.getState().settingsView.currentModule ).toBe( 'test-module' );
			} );

			it( 'accepts an empty string as no current module', () => {
				registry.dispatch( STORE_NAME ).setSettingsViewCurrentModule( '' );

				expect( store.getState().settingsView.currentModule ).toBe( '' );
			} );

			it( 'requires a string for the module slug', () => {
				const { setSettingsViewCurrentModule } = registry.dispatch( STORE_NAME );
				expect( () => setSettingsViewCurrentModule( '' ) ).not.toThrow();
				expect( () => setSettingsViewCurrentModule( null ) ).toThrow();
				expect( () => setSettingsViewCurrentModule( false ) ).toThrow();
				expect( () => setSettingsViewCurrentModule( true ) ).toThrow();
				expect( () => setSettingsViewCurrentModule( {} ) ).toThrow();
			} );
		} );

		describe( 'setSettingsViewIsEditing', () => {
			it( 'sets the isEditing value for the settings view', () => {
				expect( store.getState().settingsView.isEditing ).toBe( false );

				registry.dispatch( STORE_NAME ).setSettingsViewIsEditing( true );

				expect( store.getState().settingsView.isEditing ).toBe( true );
			} );
		} );
	} );
} );
