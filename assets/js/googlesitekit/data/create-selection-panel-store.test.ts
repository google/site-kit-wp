/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { combineStores } from 'googlesitekit-data';
import { createSelectionPanelStore } from './create-selection-panel-store';

const TEST_STORE = 'test/selection-panel';

describe( 'createSelectionPanelStore', () => {
	const initialSelectedItems = [ 'one', 'two', 'three' ];

	function registerSectionsStore() {
		const storeDefinition = combineStores(
			createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems,
			} )
		);
		const registry = createRegistry();
		registry.registerStore( TEST_STORE, storeDefinition );
		return {
			registry,
			dispatch: registry.dispatch( TEST_STORE ),
			select: registry.select( TEST_STORE ),
		};
	}

	describe( 'invariants', () => {
		it( 'should require a slug', () => {
			expect( () => {
				// @ts-expect-error - intentionally invalid input.
				createSelectionPanelStore( { initialSelectedItems: [] } );
			} ).toThrow( 'slug is required.' );
		} );

		it( 'should require a non-empty slug', () => {
			expect( () => {
				createSelectionPanelStore( {
					slug: '',
					initialSelectedItems: [],
				} );
			} ).toThrow( 'slug is required.' );
		} );

		it( 'should require initialSelectedItems to be a string array', () => {
			expect( () => {
				createSelectionPanelStore( {
					slug: 'sections',
					// @ts-expect-error - intentionally invalid input.
					initialSelectedItems: 'not-an-array',
				} );
			} ).toThrow( 'initialSelectedItems must be an array of strings.' );

			expect( () => {
				createSelectionPanelStore( {
					slug: 'sections',
					// @ts-expect-error - intentionally invalid input.
					initialSelectedItems: [ 1, 2, 3 ],
				} );
			} ).toThrow( 'initialSelectedItems must be an array of strings.' );
		} );
	} );

	describe( 'derived names', () => {
		it( 'should expose slug-namespaced action creators', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems,
			} );

			expect( Object.keys( store.actions ).sort() ).toEqual(
				[
					'closeSectionsPanel',
					'openSectionsPanel',
					'resetSectionsSelectedItems',
					'setSectionsSelectedItems',
					'toggleSectionsSelectedItem',
				].sort()
			);
		} );

		it( 'should expose slug-namespaced selectors', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems,
			} );

			expect( Object.keys( store.selectors ).sort() ).toEqual( [
				'getSectionsSelectedItems',
				'isSectionsPanelOpen',
			] );
		} );

		it( 'should seed slug-namespaced state keys', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems,
			} );

			expect( store.initialState ).toEqual( {
				isSectionsPanelOpen: false,
				sectionsSelectedItems: initialSelectedItems,
			} );
		} );

		it( 'should derive names correctly from camelCase multi-word slugs', () => {
			const store = createSelectionPanelStore( {
				slug: 'goalDrivers',
				initialSelectedItems: [],
			} );

			expect( Object.keys( store.actions ).sort() ).toEqual(
				[
					'closeGoalDriversPanel',
					'openGoalDriversPanel',
					'resetGoalDriversSelectedItems',
					'setGoalDriversSelectedItems',
					'toggleGoalDriversSelectedItem',
				].sort()
			);

			expect( Object.keys( store.selectors ).sort() ).toEqual( [
				'getGoalDriversSelectedItems',
				'isGoalDriversPanelOpen',
			] );

			expect( store.initialState ).toEqual( {
				isGoalDriversPanelOpen: false,
				goalDriversSelectedItems: [],
			} );
		} );
	} );

	describe( 'panel open/close', () => {
		it( 'should start closed', () => {
			const { select } = registerSectionsStore();
			expect( select.isSectionsPanelOpen() ).toBe( false );
		} );

		it( 'should open via openSectionsPanel()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.openSectionsPanel();
			expect( select.isSectionsPanelOpen() ).toBe( true );
		} );

		it( 'should close via closeSectionsPanel()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.openSectionsPanel();
			dispatch.closeSectionsPanel();
			expect( select.isSectionsPanelOpen() ).toBe( false );
		} );
	} );

	describe( 'selected items', () => {
		it( 'should return the initial selection by default', () => {
			const { select } = registerSectionsStore();
			expect( select.getSectionsSelectedItems() ).toEqual(
				initialSelectedItems
			);
		} );

		it( 'should replace the selection via setSectionsSelectedItems()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelectedItems( [ 'alpha', 'beta' ] );
			expect( select.getSectionsSelectedItems() ).toEqual( [
				'alpha',
				'beta',
			] );
		} );

		it( 'should add an absent item via toggleSectionsSelectedItem()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelectedItems( [ 'a' ] );
			dispatch.toggleSectionsSelectedItem( 'b' );
			expect( select.getSectionsSelectedItems() ).toEqual( [ 'a', 'b' ] );
		} );

		it( 'should remove a present item via toggleSectionsSelectedItem()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelectedItems( [ 'a', 'b', 'c' ] );
			dispatch.toggleSectionsSelectedItem( 'b' );
			expect( select.getSectionsSelectedItems() ).toEqual( [ 'a', 'c' ] );
		} );

		it( 'should restore initial selection via resetSectionsSelectedItems()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelectedItems( [ 'something-else' ] );
			expect( select.getSectionsSelectedItems() ).toEqual( [
				'something-else',
			] );

			dispatch.resetSectionsSelectedItems();
			expect( select.getSectionsSelectedItems() ).toEqual(
				initialSelectedItems
			);
		} );

		it( 'should reject non-array values to setSectionsSelectedItems()', () => {
			const { dispatch } = registerSectionsStore();
			expect( () => {
				dispatch.setSectionsSelectedItems( 'nope' );
			} ).toThrow( 'items must be an array of strings.' );
		} );

		it( 'should reject arrays of non-strings to setSectionsSelectedItems()', () => {
			const { dispatch } = registerSectionsStore();
			expect( () => {
				dispatch.setSectionsSelectedItems( [ 1, 2, 3 ] );
			} ).toThrow( 'items must be an array of strings.' );
		} );

		it( 'should reject non-string items to toggleSectionsSelectedItem()', () => {
			const { dispatch } = registerSectionsStore();
			expect( () => {
				dispatch.toggleSectionsSelectedItem( 42 );
			} ).toThrow( 'item must be a non-empty string.' );

			expect( () => {
				dispatch.toggleSectionsSelectedItem( '' );
			} ).toThrow( 'item must be a non-empty string.' );
		} );

		it( 'should not mutate the original initialSelectedItems array', () => {
			const original = [ 'a', 'b' ];
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems: original,
			} );

			expect( store.initialState ).toEqual( {
				isSectionsPanelOpen: false,
				sectionsSelectedItems: [ 'a', 'b' ],
			} );

			// Mutating the externally-owned source must not bleed into state.
			original.push( 'c' );
			expect( store.initialState.sectionsSelectedItems ).toEqual( [
				'a',
				'b',
			] );
		} );
	} );

	describe( 'multi-instance composition', () => {
		it( 'should not collide when two panels are combined in the same store', () => {
			const sections = createSelectionPanelStore( {
				slug: 'sections',
				initialSelectedItems: [ 'summary' ],
			} );
			const audiences = createSelectionPanelStore( {
				slug: 'audiences',
				initialSelectedItems: [ 'aud-1' ],
			} );

			const combined = combineStores( sections, audiences );
			const registry = createRegistry();
			registry.registerStore( TEST_STORE, combined );
			const dispatch = registry.dispatch( TEST_STORE );
			const select = registry.select( TEST_STORE );

			expect( select.isSectionsPanelOpen() ).toBe( false );
			expect( select.isAudiencesPanelOpen() ).toBe( false );

			dispatch.openSectionsPanel();
			expect( select.isSectionsPanelOpen() ).toBe( true );
			// Opening the sections panel must not affect the audiences panel.
			expect( select.isAudiencesPanelOpen() ).toBe( false );

			dispatch.toggleAudiencesSelectedItem( 'aud-2' );
			expect( select.getAudiencesSelectedItems() ).toEqual( [
				'aud-1',
				'aud-2',
			] );
			// Toggling on audiences must not affect sections.
			expect( select.getSectionsSelectedItems() ).toEqual( [
				'summary',
			] );
		} );
	} );
} );
