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
import { cloneDeep } from 'lodash';

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
 * both an audiences panel and a goals panel). The selection value is generic,
 * defaulting to `string[]` but supporting any shape the feature needs (for
 * example `Record< string, string[] >` for grouped selections).
 *
 * @since n.e.x.t
 */
export type SelectionPanelState< Slug extends string, T = string[] > = {
	[ K in `is${ PascalCase< Slug > }PanelOpen` ]: boolean;
} & {
	[ K in `${ Slug }Selection` ]: T;
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
 * Conditionally exposes a `toggle{Slug}SelectionItem` action creator when the
 * selection state is an array. For non-array selection shapes the toggle
 * semantics aren't well-defined, so the action is omitted from the type and
 * consumers should use `set{Slug}Selection` to update the value.
 *
 * @since n.e.x.t
 */
type SelectionPanelToggleAction< Slug extends string, T > = T extends Array<
	infer Item
>
	? {
			[ K in `toggle${ PascalCase< Slug > }SelectionItem` ]: (
				item: Item
			) => SelectionPanelAction;
	  }
	: Record< string, never >;

/**
 * Slug-namespaced action creators exposed by a selection-panel partial store.
 *
 * For a `Slug` of `'sections'` and the default `T = string[]` the resulting
 * keys are:
 * - `openSectionsPanel()` — opens the panel.
 * - `closeSectionsPanel()` — closes the panel.
 * - `setSectionsSelection( value )` — replaces the entire selection.
 * - `toggleSectionsSelectionItem( item )` — adds the item if absent, removes if present (array `T` only).
 * - `resetSectionsSelection()` — restores `initialSelection`.
 *
 * @since n.e.x.t
 */
export type SelectionPanelActions< Slug extends string, T = string[] > = {
	[ K in `open${ PascalCase< Slug > }Panel` ]: () => SelectionPanelAction;
} & {
	[ K in `close${ PascalCase< Slug > }Panel` ]: () => SelectionPanelAction;
} & {
	[ K in `set${ PascalCase< Slug > }Selection` ]: (
		value: T
	) => SelectionPanelAction;
} & {
	[ K in `reset${ PascalCase< Slug > }Selection` ]: () => SelectionPanelAction;
} & SelectionPanelToggleAction< Slug, T >;

/**
 * Slug-namespaced selectors exposed by a selection-panel partial store.
 *
 * For a `Slug` of `'sections'` the resulting keys are:
 * - `isSectionsPanelOpen( state )` — whether the panel is currently open.
 * - `getSectionsSelection( state )` — the current selection value.
 *
 * @since n.e.x.t
 */
export type SelectionPanelSelectors< Slug extends string, T = string[] > = {
	[ K in `is${ PascalCase< Slug > }PanelOpen` ]: (
		state: SelectionPanelState< Slug, T >
	) => boolean;
} & {
	[ K in `get${ PascalCase< Slug > }Selection` ]: (
		state: SelectionPanelState< Slug, T >
	) => T;
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
export interface SelectionPanelStore< Slug extends string, T = string[] > {
	initialState: SelectionPanelState< Slug, T >;
	actions: SelectionPanelActions< Slug, T >;
	controls: Record< string, never >;
	reducer: (
		state: SelectionPanelState< Slug, T > | undefined,
		action: SelectionPanelAction
	) => SelectionPanelState< Slug, T >;
	resolvers: Record< string, never >;
	selectors: SelectionPanelSelectors< Slug, T >;
}

/**
 * Creates a partial datastore that manages a selection panel's open/closed
 * state and selection value.
 *
 * The returned object is shaped to compose via `combineStores`. All action
 * creators, selectors, state keys, and reducer action types are namespaced by
 * the given `slug` so that multiple selection panels can live within a single
 * datastore (for example, an analytics module that hosts both an audiences
 * panel and a goals panel) without colliding.
 *
 * The selection value is generic and defaults to `string[]`. Pass a different
 * shape (e.g. `Record< string, string[] >` for grouped selections) by inferring
 * `T` from `initialSelection` or by specifying it explicitly. When `T` is an
 * array, the factory exposes a `toggle{Slug}SelectionItem` action creator that
 * adds an item if absent and removes it if present.
 *
 * @since n.e.x.t
 *
 * @param {Object} args                  Arguments for the store generation.
 * @param {string} args.slug             Camel-case panel slug used to namespace state keys, actions, and selectors (e.g. `'sections'`).
 * @param {*}      args.initialSelection Initial selection value seeded into state on store creation, and the value restored by `reset{Slug}Selection`. A deep copy is taken so subsequent mutations of the input do not affect store state.
 * @return {Object} The selection panel partial store.
 */
export function createSelectionPanelStore<
	Slug extends string,
	T = string[]
>( {
	slug,
	initialSelection,
}: {
	slug: Slug;
	initialSelection: T;
} ): SelectionPanelStore< Slug, T > {
	invariant(
		typeof slug === 'string' && slug.length > 0,
		'slug is required.'
	);
	invariant(
		initialSelection !== undefined,
		'initialSelection is required.'
	);

	const pascalSlug = camelCaseToPascalCase( slug );
	const constantSlug = camelCaseToConstantCase( slug );

	const isOpenKey = `is${ pascalSlug }PanelOpen`;
	const selectionKey = `${ slug }Selection`;

	const SET_PANEL_OPEN = `SET_${ constantSlug }_PANEL_OPEN`;
	const SET_SELECTION = `SET_${ constantSlug }_SELECTION`;
	const TOGGLE_SELECTION_ITEM = `TOGGLE_${ constantSlug }_SELECTION_ITEM`;
	const RESET_SELECTION = `RESET_${ constantSlug }_SELECTION`;

	const openPanelAction = `open${ pascalSlug }Panel`;
	const closePanelAction = `close${ pascalSlug }Panel`;
	const setSelectionAction = `set${ pascalSlug }Selection`;
	const toggleSelectionItemAction = `toggle${ pascalSlug }SelectionItem`;
	const resetSelectionAction = `reset${ pascalSlug }Selection`;

	const isPanelOpenSelector = isOpenKey;
	const getSelectionSelector = `get${ pascalSlug }Selection`;

	const initialState = {
		[ isOpenKey ]: false,
		[ selectionKey ]: cloneDeep( initialSelection ),
	} as SelectionPanelState< Slug, T >;

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
		 * Replaces the entire selection with the given value. The value is
		 * deep-cloned so that callers can safely mutate the source afterwards
		 * without affecting store state.
		 *
		 * @since n.e.x.t
		 *
		 * @param {*} value New selection value.
		 * @return {Object} Redux-style action.
		 */
		[ setSelectionAction ]( value: T ) {
			return {
				type: SET_SELECTION,
				payload: { value: cloneDeep( value ) },
			};
		},

		/**
		 * Toggles a single item in an array-shaped selection: adds the item
		 * if absent, removes it if present. Only meaningful when the
		 * selection value is an array.
		 *
		 * @since n.e.x.t
		 *
		 * @param {*} item Item to toggle.
		 * @return {Object} Redux-style action.
		 */
		[ toggleSelectionItemAction ]( item: unknown ) {
			return {
				type: TOGGLE_SELECTION_ITEM,
				payload: { item },
			};
		},

		/**
		 * Restores the selection to the `initialSelection` passed when the
		 * store was created. Typically dispatched when the panel reopens so
		 * each session starts from a known baseline.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} Redux-style action.
		 */
		[ resetSelectionAction ]() {
			return {
				type: RESET_SELECTION,
				payload: {},
			};
		},
	} as unknown as SelectionPanelActions< Slug, T >;

	const reducer = createReducer(
		( state: Record< string, unknown >, action: SelectionPanelAction ) => {
			switch ( action.type ) {
				case SET_PANEL_OPEN:
					state[ isOpenKey ] = action.payload.isOpen as boolean;
					break;

				case SET_SELECTION:
					state[ selectionKey ] = action.payload.value;
					break;

				case TOGGLE_SELECTION_ITEM: {
					const current = state[ selectionKey ];
					invariant(
						Array.isArray( current ),
						`${ toggleSelectionItemAction } requires the selection value to be an array.`
					);
					const item = action.payload.item;
					const list = current as unknown[];
					state[ selectionKey ] = list.includes( item )
						? list.filter( ( existing ) => existing !== item )
						: [ ...list, item ];
					break;
				}

				case RESET_SELECTION:
					state[ selectionKey ] = cloneDeep( initialSelection );
					break;

				default:
					break;
			}
		}
	) as SelectionPanelStore< Slug, T >[ 'reducer' ];

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
		 * Gets the panel's current selection value.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} state Data store's state.
		 * @return {*} The current selection.
		 */
		[ getSelectionSelector ]( state: Record< string, unknown > ) {
			return state[ selectionKey ] as T;
		},
	} as unknown as SelectionPanelSelectors< Slug, T >;

	return {
		initialState,
		actions,
		controls: {},
		reducer,
		resolvers: {},
		selectors,
	};
}
