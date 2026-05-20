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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { createReducer } from 'googlesitekit-data';
import {
	camelCaseToPascalCase,
	camelCaseToConstantCase,
} from './transform-case';

/**
 * Capitalises the first character of a string literal type.
 *
 * Used to derive the PascalCase form of a camelCase `Slug` so that template
 * literal types can produce idiomatic action and selector names such as
 * `openSectionsPanel` from `slug: 'sections'`.
 *
 * @since n.e.x.t
 */
type PascalCase< S extends string > = S extends `${ infer F }${ infer R }`
	? `${ Uppercase< F > }${ R }`
	: S;

/**
 * The shape of the slice of state owned by a selection panel produced by
 * createSelectionPanelStore.
 *
 * Both keys are slug-namespaced so that a single datastore can host several
 * selection panels without colliding (e.g. an analytics datastore that owns
 * both an audiences panel and a goals panel).
 *
 * @since n.e.x.t
 */
export type SelectionPanelState< Slug extends string > = {
	[ K in `is${ PascalCase< Slug > }PanelOpen` ]: boolean;
} & {
	[ K in `${ Slug }SelectedItems` ]: string[];
};

/**
 * Internal redux-style action emitted by the action creators returned from
 * createSelectionPanelStore. Consumers interact with the public action
 * creators (e.g. `openSectionsPanel`) rather than constructing these directly.
 *
 * @since n.e.x.t
 */
interface SelectionPanelAction {
	type: string;
	payload: Record< string, unknown >;
}

/**
 * Slug-namespaced action creators exposed by a selection-panel partial store.
 *
 * For a `Slug` of `'sections'` the resulting keys are:
 * - `openSectionsPanel()` — opens the panel.
 * - `closeSectionsPanel()` — closes the panel.
 * - `setSectionsSelectedItems( items )` — replaces the selection.
 * - `toggleSectionsSelectedItem( item )` — adds the item if absent, removes if present.
 * - `resetSectionsSelectedItems()` — restores `initialSelectedItems`.
 *
 * @since n.e.x.t
 */
export type SelectionPanelActions< Slug extends string > = {
	[ K in `open${ PascalCase< Slug > }Panel` ]: () => SelectionPanelAction;
} & {
	[ K in `close${ PascalCase< Slug > }Panel` ]: () => SelectionPanelAction;
} & {
	[ K in `set${ PascalCase< Slug > }SelectedItems` ]: (
		items: string[]
	) => SelectionPanelAction;
} & {
	[ K in `toggle${ PascalCase< Slug > }SelectedItem` ]: (
		item: string
	) => SelectionPanelAction;
} & {
	[ K in `reset${ PascalCase< Slug > }SelectedItems` ]: () => SelectionPanelAction;
};

/**
 * Slug-namespaced selectors exposed by a selection-panel partial store.
 *
 * For a `Slug` of `'sections'` the resulting keys are:
 * - `isSectionsPanelOpen( state )` — whether the panel is currently open.
 * - `getSectionsSelectedItems( state )` — the current selection array.
 *
 * @since n.e.x.t
 */
export type SelectionPanelSelectors< Slug extends string > = {
	[ K in `is${ PascalCase< Slug > }PanelOpen` ]: (
		state: SelectionPanelState< Slug >
	) => boolean;
} & {
	[ K in `get${ PascalCase< Slug > }SelectedItems` ]: (
		state: SelectionPanelState< Slug >
	) => string[];
};

/**
 * Shape of the partial datastore returned by createSelectionPanelStore.
 *
 * Designed to be passed into `combineStores`, optionally alongside other
 * partial stores so a feature datastore can host one or more selection panels
 * plus its domain state.
 *
 * @since n.e.x.t
 */
export interface SelectionPanelStore< Slug extends string > {
	initialState: SelectionPanelState< Slug >;
	actions: SelectionPanelActions< Slug >;
	controls: Record< string, never >;
	reducer: (
		state: SelectionPanelState< Slug > | undefined,
		action: SelectionPanelAction
	) => SelectionPanelState< Slug >;
	resolvers: Record< string, never >;
	selectors: SelectionPanelSelectors< Slug >;
}

/**
 * Creates a partial datastore that manages a selection panel's open/closed
 * state and selected items.
 *
 * The returned object is shaped to compose via `combineStores`. All action
 * creators, selectors, state keys, and reducer action types are namespaced by
 * the given `slug` so that multiple selection panels can live within a single
 * datastore (for example, an analytics module that hosts both an audiences
 * panel and a goals panel) without colliding.
 *
 * @since n.e.x.t
 *
 * @param {Object}   args                      Arguments for the store generation.
 * @param {string}   args.slug                 Camel-case panel slug used to namespace state keys, actions, and selectors (e.g. `'sections'`).
 * @param {string[]} args.initialSelectedItems Initial selection seeded into state on store creation, and the value restored by `reset…SelectedItems`.
 * @return {Object} The selection panel partial store.
 */
export function createSelectionPanelStore< Slug extends string >( {
	slug,
	initialSelectedItems,
}: {
	slug: Slug;
	initialSelectedItems: string[];
} ): SelectionPanelStore< Slug > {
	invariant(
		typeof slug === 'string' && slug.length > 0,
		'slug is required.'
	);
	invariant(
		Array.isArray( initialSelectedItems ) &&
			initialSelectedItems.every( ( item ) => typeof item === 'string' ),
		'initialSelectedItems must be an array of strings.'
	);

	const pascalSlug = camelCaseToPascalCase( slug );
	const constantSlug = camelCaseToConstantCase( slug );

	const isOpenKey = `is${ pascalSlug }PanelOpen`;
	const selectedItemsKey = `${ slug }SelectedItems`;

	const SET_PANEL_OPEN = `SET_${ constantSlug }_PANEL_OPEN`;
	const SET_SELECTED_ITEMS = `SET_${ constantSlug }_SELECTED_ITEMS`;
	const TOGGLE_SELECTED_ITEM = `TOGGLE_${ constantSlug }_SELECTED_ITEM`;
	const RESET_SELECTED_ITEMS = `RESET_${ constantSlug }_SELECTED_ITEMS`;

	const openPanelAction = `open${ pascalSlug }Panel`;
	const closePanelAction = `close${ pascalSlug }Panel`;
	const setSelectedItemsAction = `set${ pascalSlug }SelectedItems`;
	const toggleSelectedItemAction = `toggle${ pascalSlug }SelectedItem`;
	const resetSelectedItemsAction = `reset${ pascalSlug }SelectedItems`;

	const isPanelOpenSelector = isOpenKey;
	const getSelectedItemsSelector = `get${ pascalSlug }SelectedItems`;

	const initialState = {
		[ isOpenKey ]: false,
		[ selectedItemsKey ]: [ ...initialSelectedItems ],
	} as SelectionPanelState< Slug >;

	const actions = {
		/**
		 * Opens the panel.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Redux-style action.
		 */
		[ openPanelAction ]() {
			return {
				type: SET_PANEL_OPEN,
				payload: { isOpen: true },
			};
		},

		/**
		 * Closes the panel.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Redux-style action.
		 */
		[ closePanelAction ]() {
			return {
				type: SET_PANEL_OPEN,
				payload: { isOpen: false },
			};
		},

		/**
		 * Replaces the entire selection with the given array of item slugs.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string[]} items Items that should constitute the new selection.
		 * @return {Object} Redux-style action.
		 */
		[ setSelectedItemsAction ]( items: string[] ) {
			invariant(
				Array.isArray( items ) &&
					items.every( ( item ) => typeof item === 'string' ),
				'items must be an array of strings.'
			);

			return {
				type: SET_SELECTED_ITEMS,
				payload: { items: [ ...items ] },
			};
		},

		/**
		 * Toggles a single item in the selection: adds it if absent, removes
		 * it if present.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} item The item slug to toggle.
		 * @return {Object} Redux-style action.
		 */
		[ toggleSelectedItemAction ]( item: string ) {
			invariant(
				typeof item === 'string' && item.length > 0,
				'item must be a non-empty string.'
			);

			return {
				type: TOGGLE_SELECTED_ITEM,
				payload: { item },
			};
		},

		/**
		 * Restores the selection to the `initialSelectedItems` passed when the
		 * store was created. Typically dispatched when the panel reopens so
		 * each session starts from a known baseline.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Redux-style action.
		 */
		[ resetSelectedItemsAction ]() {
			return {
				type: RESET_SELECTED_ITEMS,
				payload: {},
			};
		},
	} as unknown as SelectionPanelActions< Slug >;

	const reducer = createReducer(
		( state: Record< string, unknown >, action: SelectionPanelAction ) => {
			switch ( action.type ) {
				case SET_PANEL_OPEN:
					state[ isOpenKey ] = action.payload.isOpen as boolean;
					break;

				case SET_SELECTED_ITEMS:
					state[ selectedItemsKey ] = action.payload
						.items as string[];
					break;

				case TOGGLE_SELECTED_ITEM: {
					const item = action.payload.item as string;
					const current =
						( state[ selectedItemsKey ] as string[] ) || [];

					state[ selectedItemsKey ] = current.includes( item )
						? current.filter( ( existing ) => existing !== item )
						: [ ...current, item ];
					break;
				}

				case RESET_SELECTED_ITEMS:
					state[ selectedItemsKey ] = [ ...initialSelectedItems ];
					break;

				default:
					break;
			}
		}
	) as SelectionPanelStore< Slug >[ 'reducer' ];

	const selectors = {
		/**
		 * Determines whether the selection panel is currently open.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {boolean} `true` if the panel is open, `false` otherwise.
		 */
		[ isPanelOpenSelector ]( state: Record< string, unknown > ) {
			return Boolean( state[ isOpenKey ] );
		},

		/**
		 * Gets the panel's currently selected items.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {string[]} The current selection.
		 */
		[ getSelectedItemsSelector ]( state: Record< string, unknown > ) {
			return ( state[ selectedItemsKey ] as string[] ) || [];
		},
	} as unknown as SelectionPanelSelectors< Slug >;

	return {
		initialState,
		actions,
		controls: {},
		reducer,
		resolvers: {},
		selectors,
	};
}
