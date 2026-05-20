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
	const initialSelection = [ 'one', 'two', 'three' ];

	function registerSectionsStore() {
		const storeDefinition = combineStores(
			createSelectionPanelStore( {
				slug: 'sections',
				initialSelection,
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
				createSelectionPanelStore( { initialSelection: [] } );
			} ).toThrow( 'slug is required.' );
		} );

		it( 'should require a non-empty slug', () => {
			expect( () => {
				createSelectionPanelStore( {
					slug: '',
					initialSelection: [],
				} );
			} ).toThrow( 'slug is required.' );
		} );

		it( 'should require initialSelection to be defined', () => {
			expect( () => {
				createSelectionPanelStore( {
					slug: 'sections',
					initialSelection: undefined,
				} );
			} ).toThrow( 'initialSelection is required.' );
		} );
	} );

	describe( 'derived names', () => {
		it( 'should expose slug-namespaced action creators', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelection,
			} );

			expect( Object.keys( store.actions ).sort() ).toEqual(
				[
					'closeSectionsPanel',
					'openSectionsPanel',
					'resetSectionsSelection',
					'setSectionsSelection',
					'toggleSectionsSelectionItem',
				].sort()
			);
		} );

		it( 'should expose slug-namespaced selectors', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelection,
			} );

			expect( Object.keys( store.selectors ).sort() ).toEqual( [
				'getSectionsSelection',
				'isSectionsPanelOpen',
			] );
		} );

		it( 'should seed slug-namespaced state keys', () => {
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelection,
			} );

			expect( store.initialState ).toEqual( {
				isSectionsPanelOpen: false,
				sectionsSelection: initialSelection,
			} );
		} );

		it( 'should derive names correctly from camelCase multi-word slugs', () => {
			const store = createSelectionPanelStore( {
				slug: 'goalDrivers',
				initialSelection: [],
			} );

			expect( Object.keys( store.actions ).sort() ).toEqual(
				[
					'closeGoalDriversPanel',
					'openGoalDriversPanel',
					'resetGoalDriversSelection',
					'setGoalDriversSelection',
					'toggleGoalDriversSelectionItem',
				].sort()
			);

			expect( Object.keys( store.selectors ).sort() ).toEqual( [
				'getGoalDriversSelection',
				'isGoalDriversPanelOpen',
			] );

			expect( store.initialState ).toEqual( {
				isGoalDriversPanelOpen: false,
				goalDriversSelection: [],
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

	describe( 'selection (array shape)', () => {
		it( 'should return the initial selection by default', () => {
			const { select } = registerSectionsStore();
			expect( select.getSectionsSelection() ).toEqual( initialSelection );
		} );

		it( 'should replace the selection via setSectionsSelection()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelection( [ 'alpha', 'beta' ] );
			expect( select.getSectionsSelection() ).toEqual( [
				'alpha',
				'beta',
			] );
		} );

		it( 'should add an absent item via toggleSectionsSelectionItem()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelection( [ 'a' ] );
			dispatch.toggleSectionsSelectionItem( 'b' );
			expect( select.getSectionsSelection() ).toEqual( [ 'a', 'b' ] );
		} );

		it( 'should remove a present item via toggleSectionsSelectionItem()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelection( [ 'a', 'b', 'c' ] );
			dispatch.toggleSectionsSelectionItem( 'b' );
			expect( select.getSectionsSelection() ).toEqual( [ 'a', 'c' ] );
		} );

		it( 'should restore initial selection via resetSectionsSelection()', () => {
			const { dispatch, select } = registerSectionsStore();
			dispatch.setSectionsSelection( [ 'something-else' ] );
			expect( select.getSectionsSelection() ).toEqual( [
				'something-else',
			] );

			dispatch.resetSectionsSelection();
			expect( select.getSectionsSelection() ).toEqual( initialSelection );
		} );

		it( 'should deep-copy the initial selection so source mutations do not leak into state', () => {
			const original = [ 'a', 'b' ];
			const store = createSelectionPanelStore( {
				slug: 'sections',
				initialSelection: original,
			} );

			expect( store.initialState ).toEqual( {
				isSectionsPanelOpen: false,
				sectionsSelection: [ 'a', 'b' ],
			} );

			original.push( 'c' );
			expect( store.initialState.sectionsSelection ).toEqual( [
				'a',
				'b',
			] );
		} );

		it( 'should deep-copy values passed to setSectionsSelection()', () => {
			const { dispatch, select } = registerSectionsStore();
			const items = [ 'x', 'y' ];
			dispatch.setSectionsSelection( items );

			items.push( 'z' );
			expect( select.getSectionsSelection() ).toEqual( [ 'x', 'y' ] );
		} );
	} );

	describe( 'selection (generic shape)', () => {
		type GoalDrivers = Record< string, string[] >;

		const initialDrivers: GoalDrivers = {
			ECOMMERCE: [ 'e1' ],
			LEAD: [ 'l1', 'l2' ],
		};

		function registerGoalsStore() {
			const storeDefinition = combineStores(
				createSelectionPanelStore< 'goalDrivers', GoalDrivers >( {
					slug: 'goalDrivers',
					initialSelection: initialDrivers,
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

		it( 'should support a non-array generic selection value', () => {
			const { select } = registerGoalsStore();
			expect( select.getGoalDriversSelection() ).toEqual(
				initialDrivers
			);
		} );

		it( 'should replace a non-array selection via setGoalDriversSelection()', () => {
			const { dispatch, select } = registerGoalsStore();
			const next: GoalDrivers = { ECOMMERCE: [ 'e2' ] };
			dispatch.setGoalDriversSelection( next );
			expect( select.getGoalDriversSelection() ).toEqual( next );
		} );

		it( 'should reset a non-array selection back to the initial value', () => {
			const { dispatch, select } = registerGoalsStore();
			dispatch.setGoalDriversSelection( { LEAD: [] } );
			expect( select.getGoalDriversSelection() ).toEqual( {
				LEAD: [],
			} );

			dispatch.resetGoalDriversSelection();
			expect( select.getGoalDriversSelection() ).toEqual(
				initialDrivers
			);
		} );

		it( 'should deep-copy nested selection values', () => {
			const original: GoalDrivers = {
				ECOMMERCE: [ 'e1' ],
				LEAD: [ 'l1' ],
			};
			const store = createSelectionPanelStore<
				'goalDrivers',
				GoalDrivers
			>( {
				slug: 'goalDrivers',
				initialSelection: original,
			} );

			// Mutate a nested array in the source.
			original.ECOMMERCE.push( 'e2' );

			expect( store.initialState.goalDriversSelection ).toEqual( {
				ECOMMERCE: [ 'e1' ],
				LEAD: [ 'l1' ],
			} );
		} );

		it( 'should throw when toggle action is dispatched against a non-array selection', () => {
			const { dispatch } = registerGoalsStore();
			expect( () => {
				dispatch.toggleGoalDriversSelectionItem( 'anything' );
			} ).toThrow(
				/toggleGoalDriversSelectionItem requires the selection value to be an array/
			);
		} );
	} );

	describe( 'multi-instance composition', () => {
		it( 'should not collide when two panels are combined in the same store', () => {
			const sections = createSelectionPanelStore( {
				slug: 'sections',
				initialSelection: [ 'summary' ],
			} );
			const audiences = createSelectionPanelStore( {
				slug: 'audiences',
				initialSelection: [ 'aud-1' ],
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

			dispatch.toggleAudiencesSelectionItem( 'aud-2' );
			expect( select.getAudiencesSelection() ).toEqual( [
				'aud-1',
				'aud-2',
			] );
			// Toggling on audiences must not affect sections.
			expect( select.getSectionsSelection() ).toEqual( [ 'summary' ] );
		} );
	} );
} );
