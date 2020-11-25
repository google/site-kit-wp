/**
 * `googlesitekit/modules` datastore: settings panel tests.
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
import { STORE_NAME } from './constants';
import { initialState } from './settings-panel';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules settings-panel', () => {
	let registry;
	let store;
	const slug = 'test-module';
	const expectedInitialState = { ...initialState.settingsPanel };

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			expect( Object.keys( store.getState() ) ).toContain( 'settingsPanel' );
			expect( store.getState().settingsPanel ).toEqual( expectedInitialState );
		} );
	} );

	describe( 'actions', () => {
		describe( 'setModuleSettingsPanelState', () => {
			it( 'sets module settings panel state', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( store.getState().settingsPanel ).toEqual( { ...expectedInitialState, currentModule: slug, isEditing: false } );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( store.getState().settingsPanel ).toEqual( { ...expectedInitialState, currentModule: slug, isEditing: true } );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( store.getState().settingsPanel ).toEqual( { ...expectedInitialState, currentModule: null, isEditing: false } );
			} );

			it( 'should not change the panel state when called with an invalid value', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				const expectedState = { ... store.getState().settingsPanel };

				expect( () => {
					registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'invalid' );
				} ).toThrow( 'value should be one of closed,edit,view' );
				expect( store.getState().settingsPanel ).toEqual( expectedState );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleSettingsPanelState', () => {
			it( 'returns "closed" by default', () => {
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );
			} );

			it( 'returns the settings panel state for a module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				registry.select( STORE_NAME ).getModuleSettingsPanelState( slug );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'view' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'edit' );
			} );
		} );

		describe( 'isModuleSettingsPanelOpen', () => {
			it( 'returns true when module settings panel is in view state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelOpen( slug ) ).toBe( true );
			} );

			it( 'returns true when module settings panel is in edit state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelOpen( slug ) ).toBe( true );
			} );

			it( 'returns false when module settings panel is closed for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelOpen( slug ) ).toBe( false );
			} );
		} );

		describe( 'isModuleSettingsPanelClosed', () => {
			it( 'returns true when module settings panel is closed for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelClosed( slug ) ).toBe( true );
			} );

			it( 'returns false when module settings panel is in view state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelClosed( slug ) ).toBe( false );
			} );

			it( 'returns false when module settings panel is in edit state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelClosed( slug ) ).toBe( false );
			} );
		} );

		describe( 'isModuleSettingsPanelEdit', () => {
			it( 'returns true when module settings panel is in edit state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelEdit( slug ) ).toBe( true );
			} );

			it( 'returns false when module settings panel is in view state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelEdit( slug ) ).toBe( false );
			} );

			it( 'returns false when module settings panel is in closed state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelEdit( slug ) ).toBe( false );
			} );
		} );

		describe( 'isModuleSettingsPanelLocked', () => {
			it( 'returns true when module settings panel is locked for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( 'another-slug', 'edit' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelLocked( slug ) ).toBe( true );
			} );

			it( 'returns false when module settings panel is not locked for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelLocked( slug ) ).toBe( false );
			} );

			it( 'returns false when module settings panel is in view state for a given module', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).isModuleSettingsPanelLocked( slug ) ).toBe( false );
			} );
		} );
	} );
} );
