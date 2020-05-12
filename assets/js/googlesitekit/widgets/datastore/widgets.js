/**
 * core/widgets data store: widgets info.
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
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';

const { commonActions, createRegistrySelector } = Data;

/**
 * Store our widget components by registry, then by widget `slug`. We do this because
 * we can't store React components in our data store.
 *
 * @private
 * @since n.e.x.t
 */
export const WidgetComponents = {};

const ASSIGN_WIDGET = 'ASSIGN_WIDGET';
const REGISTER_WIDGET = 'REGISTER_WIDGET';
const SET_WIDGET_COMPONENT_KEY = 'SET_WIDGET_COMPONENT_KEY';

export const INITIAL_STATE = {
	registryKey: undefined,
	widgets: {},
};

export const actions = {
	/**
	 * Assigns an existing widget (by slug) to a widget area(s).
	 *
	 * @since n.e.x.t
	 *
	 * @param  {string}         slug      Widget slug.
	 * @param  {(string|Array)} areaSlugs Widget Area slug(s).
	 * @return {Object}                   Redux-style action.
	 */
	assignWidget( slug, areaSlugs ) {
		let areaSlugsAsArray;
		if ( typeof areaSlugs === 'string' ) {
			areaSlugsAsArray = [ areaSlugs ];
		} else {
			areaSlugsAsArray = [ ...areaSlugs ];
		}

		return {
			payload: { slug, areaSlugs: areaSlugsAsArray },
			type: ASSIGN_WIDGET,
		};
	},

	/**
	 * Register a widget with a given slug and settings.
	 *
	 * @since n.e.x.t
	 * @param {string} slug           Widget's slug.
	 * @param {Object} settings       Widget's settings.
	 * @return {Object}          Redux-style action.
	 */
	*registerWidget( slug, settings ) {
		const registry = yield commonActions.getRegistry();
		let registryKey = yield registry.select( STORE_NAME ).getWidgetRegistryKey();

		if ( registryKey === undefined ) {
			registryKey = Object.keys( WidgetComponents ).length + 1;
			yield {
				payload: { registryKey },
				type: SET_WIDGET_COMPONENT_KEY,
			};
		}

		// We do this assignment in the action rather than the reducer because we can't send a
		// payload that includes a React component to the reducer; we'll get an error about
		// payloads needing to be plain objects.
		if ( WidgetComponents[ registryKey ] === undefined ) {
			WidgetComponents[ registryKey ] = {};
		}
		if ( WidgetComponents[ registryKey ][ slug ] === undefined ) {
			WidgetComponents[ registryKey ][ slug ] = settings.component;
		}
		const settingsToUse = {
			priority: 10,
			...settings,
		};
		delete settingsToUse.component;

		yield {
			payload: { slug, settings: settingsToUse },
			type: REGISTER_WIDGET,
		};

		return {};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case ASSIGN_WIDGET: {
			const { slug, areaSlugs } = payload;

			const { areaWidgets } = state;
			areaSlugs.forEach( ( areaSlug ) => {
				if ( areaWidgets[ areaSlug ] === undefined ) {
					areaWidgets[ areaSlug ] = [];
				}

				if ( ! areaWidgets[ areaSlug ].includes( slug ) ) {
					areaWidgets[ areaSlug ].push( slug );
				}
			} );

			return {
				...state,
				areaWidgets,
			};
		}

		case REGISTER_WIDGET: {
			const { slug, settings } = payload;

			if ( state.widgets[ slug ] !== undefined ) {
				global.console.warn( `Could not register widget with slug "${ slug }". Widget "${ slug }" is already registered.` );

				return { ...state };
			}

			return {
				...state,
				widgets: {
					...state.widgets,
					[ slug ]: { ...settings, slug },
				},
			};
		}

		case SET_WIDGET_COMPONENT_KEY: {
			const { registryKey } = payload;

			return {
				...state,
				registryKey,
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const resolvers = {
};

export const selectors = {
	/**
	 * Checks if a widget has been registered with a given slug.
	 *
	 * Returns `true` if the widget area has been registered.
	 * Returns `false` if the widget area has NOT been registered.
	 *
	 * @since n.e.x.t
	 *
	 * @param  {Object}  state Data store's state.
	 * @param  {string}  slug  Widget's slug.
	 * @return {boolean}       `true`/`false` based on whether widget has been registered.
	 */
	isWidgetRegistered( state, slug ) {
		const { widgets } = state;

		return widgets[ slug ] !== undefined;
	},

	/**
	 * Returns all widgets registered for a given widget area.
	 *
	 * Returns an array of all widgets for a given area.
	 * The widgets are returned in order of their priority, so can be rendered in
	 * the order provided by the selector.
	 *
	 * @since n.e.x.t
	 *
	 * @param  {Object} state          Data store's state.
	 * @param  {string} widgetAreaSlug Widget context to get areas for.
	 * @return {Array}                 An ordered array of widgets for this area.
	 */
	getWidgets: createRegistrySelector( ( select ) => ( state, widgetAreaSlug ) => {
		invariant( widgetAreaSlug, 'widgetAreaSlug is required.' );

		const { areaWidgets, widgets } = state;

		const registryKey = select( STORE_NAME ).getWidgetRegistryKey();

		return Object.values( widgets ).filter( ( widget ) => {
			return areaWidgets[ widgetAreaSlug ] && areaWidgets[ widgetAreaSlug ].includes( widget.slug );
		} ).sort( ( widgetA, widgetB ) => {
			return ( widgetA.priority >= widgetB.priority ) ? 1 : -1;
		} ).map( ( widget ) => {
			const widgetWithComponent = { ...widget };
			if ( WidgetComponents[ registryKey ] ) {
				widgetWithComponent.component = WidgetComponents[ registryKey ][ widget.slug ];
			}

			return widgetWithComponent;
		} );
	} ),

	/**
	 * Returns the registry key being used for this registry's widgets.
	 *
	 * We key each registry with an Integer, so we don't share registered widgets
	 * between registries. This allows us to access the appropriate registry global
	 * from inside selectors.
	 *
	 * @private
	 * @since n.e.x.t
	 *
	 * @param  {Object}              state Data store's state.
	 * @return {(number|undefined)}        An ordered array of widgets for this area.
	 */
	getWidgetRegistryKey( state ) {
		const { registryKey } = state;

		return registryKey;
	},
};

export default {
	INITIAL_STATE,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
