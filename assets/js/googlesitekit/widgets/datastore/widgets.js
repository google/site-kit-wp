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
import { v4 as uuidv4 } from 'uuid';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { WIDGET_WIDTHS } from './constants';
import { sortByProperty } from '../../../util/sort-by-property';
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

const { commonActions, createRegistrySelector } = Data;

/**
 * Store our widget components by registry, then by widget `slug`. We do this because
 * we can't store React components in our data store.
 *
 * @private
 * @since 1.9.0
 */
export const WidgetComponents = {};

const ASSIGN_WIDGET = 'ASSIGN_WIDGET';
const REGISTER_WIDGET = 'REGISTER_WIDGET';

const WidgetWidthKeys = Object.keys( WIDGET_WIDTHS ).map( ( ( key ) => `WIDGET_WIDTHS.${ key }` ) ).join( ', ' );

export const initialState = {
	areaAssignments: {},
	registryKey: undefined,
	widgets: {},
};

export const actions = {
	/**
	 * Assigns an existing widget (by slug) to a widget area(s).
	 *
	 * @since 1.9.0
	 *
	 * @param {string}         slug      Widget slug.
	 * @param {(string|Array)} areaSlugs Widget Area slug(s).
	 * @return {Object} Redux-style action.
	 */
	assignWidget( slug, areaSlugs ) {
		return {
			payload: {
				slug,
				areaSlugs: ( typeof areaSlugs === 'string' ) ? [ areaSlugs ] : areaSlugs,
			},
			type: ASSIGN_WIDGET,
		};
	},

	/**
	 * Register a widget with a given slug and settings.
	 *
	 * @since 1.9.0
	 * @since 1.12.0 Added wrapWidget setting.
	 *
	 * @param {string}      slug                Widget's slug.
	 * @param {Object}      settings            Widget's settings.
	 * @param {WPComponent} settings.component  React component used to display the contents of this widget.
	 * @param {number}      settings.priority   Optional. Widget's priority for ordering (lower number is higher priority, like WordPress hooks). Default is: 10.
	 * @param {string}      settings.width      Optional. Widget's maximum width to occupy. Default is: "quarter". One of: "quarter", "half", "full".
	 * @param {boolean}     settings.wrapWidget Optional. Whether to wrap the component with the <Widget> wrapper. Default is: true.
	 * @return {Object} Redux-style action.
	 */
	*registerWidget( slug, {
		component,
		priority = 10,
		width = WIDGET_WIDTHS.QUARTER,
		wrapWidget = true,
	} = {} ) {
		invariant( component, 'component is required to register a widget.' );
		invariant( Object.values( WIDGET_WIDTHS ).includes( width ), `Widget width should be one of: ${ WidgetWidthKeys }, but "${ width }" was provided.` );

		const registry = yield commonActions.getRegistry();
		let registryKey = yield registry.select( CORE_SITE ).getRegistryKey();

		if ( registryKey === undefined ) {
			registryKey = uuidv4();
			yield registry.dispatch( CORE_SITE ).setRegistryKey( registryKey );
		}

		// We do this assignment in the action rather than the reducer because we can't send a
		// payload that includes a React component to the reducer; we'll get an error about
		// payloads needing to be plain objects.
		if ( WidgetComponents[ registryKey ] === undefined ) {
			WidgetComponents[ registryKey ] = {};
		}
		if ( WidgetComponents[ registryKey ][ slug ] === undefined ) {
			WidgetComponents[ registryKey ][ slug ] = component;
		}

		yield {
			payload: { slug, settings: { priority, width, wrapWidget } },
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

			const { areaAssignments } = state;
			areaSlugs.forEach( ( areaSlug ) => {
				if ( areaAssignments[ areaSlug ] === undefined ) {
					areaAssignments[ areaSlug ] = [];
				}

				if ( ! areaAssignments[ areaSlug ].includes( slug ) ) {
					areaAssignments[ areaSlug ].push( slug );
				}
			} );

			return {
				...state,
				areaAssignments,
			};
		}

		case REGISTER_WIDGET: {
			const { slug, settings } = payload;

			if ( state.widgets[ slug ] !== undefined ) {
				global.console.warn( `Could not register widget with slug "${ slug }". Widget "${ slug }" is already registered.` );

				return state;
			}

			return {
				...state,
				widgets: {
					...state.widgets,
					[ slug ]: { ...settings, slug },
				},
			};
		}

		default: {
			return state;
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
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Widget's slug.
	 * @return {boolean} `true`/`false` based on whether widget has been registered.
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
	 * @since 1.9.0
	 *
	 * @param {Object} state          Data store's state.
	 * @param {string} widgetAreaSlug Widget context to get areas for.
	 * @return {Array} An ordered array of widgets for this area.
	 */
	getWidgets: createRegistrySelector( ( select ) => ( state, widgetAreaSlug ) => {
		invariant( widgetAreaSlug, 'widgetAreaSlug is required.' );

		const { areaAssignments, widgets } = state;

		const registryKey = select( CORE_SITE ).getRegistryKey();

		const sorted = sortByProperty(
			Object.values( widgets ).filter( ( widget ) => {
				return areaAssignments[ widgetAreaSlug ] && areaAssignments[ widgetAreaSlug ].includes( widget.slug );
			} ).map( ( widget ) => {
				const widgetWithComponent = { ...widget };
				if ( WidgetComponents[ registryKey ] ) {
					widgetWithComponent.component = WidgetComponents[ registryKey ][ widget.slug ];
				}

				return widgetWithComponent;
			} ),
			'priority'
		);
		return sorted;
	} ),

	/**
	 * Returns a single widget, by slug.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Widget slug.
	 * @return {Object|null} A widget object, if one exists.
	 */
	getWidget: createRegistrySelector( ( select ) => ( state, slug ) => {
		invariant( slug, 'slug is required to get a widget.' );

		const { widgets } = state;

		const registryKey = select( CORE_SITE ).getRegistryKey();

		const widget = widgets[ slug ];
		if ( widget && WidgetComponents[ registryKey ] ) {
			widget.component = WidgetComponents[ registryKey ][ widget.slug ];
		}

		return widget || null;
	} ),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
