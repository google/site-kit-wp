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
import settings from './settings';
import { createTestRegistry } from '../../../../../tests/js/utils';

describe( 'core/modules module settings panel', () => {
	let registry;
	let store;
	const slug = 'test-module';
	const nonExistentModuleSlug = 'not-module';
	const moduleStoreName = `modules/${ slug }`;

	beforeEach( () => {
		const storeDefinition = Modules.createModuleStore( moduleStoreName );
		const isModuleActive = ( state, moduleSlug ) => {
			return slug === moduleSlug ? true : null;
		};

		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		registry.registerStore( STORE_NAME, Data.combineStores(
			store,
			{
				selectors: {
					isModuleActive,
				},
			},
			settings,
		) );

		registry.registerStore( moduleStoreName, Data.combineStores(
			storeDefinition,
		) );
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			expect( true ).toBeTruthy();
			const initialState = {};
			const initialStoreState = store.getState();

			// Ensure we have default state correct
			expect( Object.keys( initialStoreState ) ).toContain( 'panelState' );
			expect( initialStoreState.panelState ).toEqual( initialState );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getModuleSettingsPanelState', () => {
			it( 'gets module settings panel state', () => {
				// Default state for valid module is closed
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );
				// Default state for invalid module is closed
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( null );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'view' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'closed' );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'edit' );

				// If the value is edit, all other module settings panels which currently have a status of view or edit should automatically be set to locked.
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( nonExistentModuleSlug, 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( 'edit' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'locked' );

				// If the value is closed or view and previously the value was edit, all other module settings panels which currently have a status of locked should automatically be set to view.
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( nonExistentModuleSlug, 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( nonExistentModuleSlug ) ).toBe( 'closed' );
				expect( registry.select( STORE_NAME ).getModuleSettingsPanelState( slug ) ).toBe( 'view' );
			} );
		} );
	} );

	describe( 'actions', () => {
		describe( 'setModuleSettingsPanelState', () => {
			it( 'sets module settings panel state', () => {
				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'closed' );
				let expectedPanelState = { ...store.getState().panelState, [ slug ]: 'closed' };
				expect( store.getState().panelState ).toEqual( expectedPanelState );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'view' );
				expectedPanelState = { ...store.getState().panelState, [ slug ]: 'view' };
				expect( store.getState().panelState ).toEqual( expectedPanelState );

				registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'edit' );
				expectedPanelState = { ...store.getState().panelState, [ slug ]: 'edit' };
				expect( store.getState().panelState ).toEqual( expectedPanelState );

				expect( () => {
					registry.dispatch( STORE_NAME ).setModuleSettingsPanelState( slug, 'invalid' );
				} ).toThrow();
				// State shouldn't have changed with an invalid setting value.
				expect( store.getState().panelState ).toEqual( expectedPanelState );
			} );
		} );
	} );
} );
