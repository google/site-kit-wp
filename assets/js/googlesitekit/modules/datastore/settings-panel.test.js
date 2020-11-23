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
import Data from 'googlesitekit-data';
import Modules from 'googlesitekit-modules';
import { STORE_NAME } from './constants';
import { initialState } from './settings-panel';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules settings-panel', () => {
	let registry;
	let store;
	const slug = 'test-module';
	const nonExistentModuleSlug = 'not-module';
	const moduleStoreName = `modules/${ slug }`;
	const expectedInitialState = { ...initialState };

	beforeEach( () => {
		const storeDefinition = Modules.createModuleStore( moduleStoreName );

		registry = createTestRegistry();
		registry.dispatch( STORE_NAME ).receiveGetModules( [
			{ slug, active: true },
		] );

		registry.registerStore( moduleStoreName, Data.combineStores(
			storeDefinition,
		) );

		store = registry.stores[ STORE_NAME ].store;
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			expect( Object.keys( store.getState() ) ).toContain( 'panelState' );
			expect( store.getState().panelState ).toEqual( expectedInitialState );
		} );
	} );

	describe( 'actions', () => {
		describe( 'setModuleSettingsPanelState', () => {
			it( 'sets module settings panel state', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( store.getState().panelState ).toEqual( { ...expectedInitialState, modules: { [ slug ]: 'closed' } } );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( store.getState().panelState ).toEqual( { ...expectedInitialState, modules: { [ slug ]: 'view' } } );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( store.getState().panelState ).toEqual( { ...expectedInitialState, modules: { [ slug ]: 'edit' }, editing: slug } );
			} );

			it( 'should not change the panel state when called with an invalid value', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );

				expect( () => {
					registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'invalid' );
				} ).toThrow( 'value should be one of closed,edit,view' );
				expect( store.getState().panelState ).toEqual( { ...expectedInitialState, modules: { [ slug ]: 'closed' } } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleSettingsPanelState', () => {
			it( 'checks that default module settings panel state is closed', () => {
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( null );
			} );
			it( 'checks we can get every module settings panel state', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				registry.select( STORE_NAME ).getModuleSettingsPanelState( slug );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'view' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'edit' );
			} );

			it( 'if the value is edit, all other module settings panels which currently have a status of view or edit should automatically be set to locked', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( nonExistentModuleSlug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'locked' );
			} );

			it( 'if the value is closed or view and previously the value was edit, all other module settings panels which currently have a status of locked should automatically be set to view.', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( nonExistentModuleSlug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'locked' );
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( nonExistentModuleSlug, 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'view' );
			} );
		} );
	} );
} );
