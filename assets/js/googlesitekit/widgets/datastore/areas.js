/**
 * `core/widgets` data store: widgets info.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_WIDGETS, WIDGET_AREA_STYLES } from './constants';
import { sortByProperty } from '../../../util/sort-by-property';
import { createReducer } from '../../../../js/googlesitekit/data/create-reducer';

const { createRegistrySelector } = Data;

const ASSIGN_WIDGET_AREA = 'ASSIGN_WIDGET_AREA';
const REGISTER_WIDGET_AREA = 'REGISTER_WIDGET_AREA';

const WidgetAreaStyleKeys = Object.keys( WIDGET_AREA_STYLES )
	.map( ( key ) => `WIDGET_AREA_STYLES.${ key }` )
	.join( ', ' );

export const initialState = {
	areas: {},
	contextAssignments: {},
};

export const actions = {
	/**
	 * Assigns a widget area to one (or several) contexts.
	 *
	 * Accepts an area slug to register as the first argument, then either a string
	 * (for a single context slug) or array of contexts slugs (to assign the widget area
	 * to multiple contexts).
	 *
	 * Does not error if any of the requested contexts do not exist, but will console.warn
	 * a message about non-existant contexts.
	 *
	 * Does not error if the area slug provided does not exist, but will console.warn a
	 * message about non-existent areas.
	 *
	 * @since 1.9.0
	 *
	 * @param {string}         slug         Widget Area's slug.
	 * @param {(string|Array)} contextSlugs Widget Context's slug(s).
	 * @return {Object} Redux-style action.
	 */
	assignWidgetArea( slug, contextSlugs ) {
		return {
			payload: {
				slug,
				contextSlugs:
					typeof contextSlugs === 'string'
						? [ contextSlugs ]
						: contextSlugs,
			},
			type: ASSIGN_WIDGET_AREA,
		};
	},

	/**
	 * Creates a widget area with a given name and settings.
	 *
	 * @since 1.9.0
	 * @since 1.107.0 Extended to support an optional CTA component.
	 * @since n.e.x.t Extended to support an optional filterActiveWidgets function.
	 *
	 * @param {string}      slug                           Widget Area's slug.
	 * @param {Object}      settings                       Widget Area's settings.
	 * @param {string}      settings.title                 Title for this widget area.
	 * @param {string}      [settings.subtitle]            Optional. Subtitle for this widget area.
	 * @param {WPComponent} [settings.Icon]                Optional. React component to render icon for this widget area.
	 * @param {string}      [settings.style]               Optional. Widget area style (one of "boxes", "composite"). Default: "boxes".
	 * @param {number}      [settings.priority]            Optional. Priority for this widget area. Default: 10.
	 * @param {WPComponent} [settings.CTA]                 React component used as CTA appearing beside the subtitle.
	 * @param {Function}    [settings.filterActiveWidgets] Optional. Function used to filter active widgets.
	 * @return {Object} Redux-style action.
	 */
	registerWidgetArea(
		slug,
		{
			priority = 10,
			style = WIDGET_AREA_STYLES.BOXES,
			title,
			subtitle,
			Icon,
			CTA,
			filterActiveWidgets,
		} = {}
	) {
		invariant( slug, 'slug is required.' );
		invariant( title, 'settings.title is required.' );
		invariant(
			Object.values( WIDGET_AREA_STYLES ).includes( style ),
			`settings.style must be one of: ${ WidgetAreaStyleKeys }.`
		);

		return {
			payload: {
				slug,
				settings: {
					priority,
					style,
					title,
					subtitle,
					Icon,
					CTA,
					filterActiveWidgets,
				},
			},
			type: REGISTER_WIDGET_AREA,
		};
	},
};

export const controls = {};

export const reducer = createReducer( ( state, { type, payload } ) => {
	switch ( type ) {
		case ASSIGN_WIDGET_AREA: {
			const { slug, contextSlugs } = payload;

			contextSlugs.forEach( ( contextSlug ) => {
				if ( state.contextAssignments[ contextSlug ] === undefined ) {
					state.contextAssignments[ contextSlug ] = [];
				}

				if (
					! state.contextAssignments[ contextSlug ].includes( slug )
				) {
					state.contextAssignments[ contextSlug ].push( slug );
				}
			} );

			return state;
		}

		case REGISTER_WIDGET_AREA: {
			const { slug, settings } = payload;

			if ( state.areas[ slug ] !== undefined ) {
				global.console.warn(
					`Could not register widget area with slug "${ slug }". Widget area "${ slug }" is already registered.`
				);

				return state;
			}

			state.areas[ slug ] = { ...settings, slug };
			return state;
		}

		default: {
			return state;
		}
	}
} );

export const resolvers = {};

export const selectors = {
	/**
	 * Checks if a widget area is active.
	 *
	 * Returns `true` if the widget area is active.
	 * Returns `false` if the widget area is NOT active.
	 *
	 * @since 1.47.0
	 * @since 1.77.0 Add options.modules parameter.
	 * @since n.e.x.t Filter active widgets by module.
	 *
	 * @param {Object}         state             Data store's state.
	 * @param {string}         slug              Widget area's slug.
	 * @param {Object}         [options]         Optional. Options parameter.
	 * @param {Array.<string>} [options.modules] Optional. List of module slugs, when provided the widgets checked will be restricted to those associated with the specified modules.
	 * @return {boolean} `true`/`false` based on whether widget area is active.
	 */
	isWidgetAreaActive: createRegistrySelector(
		( select ) =>
			( state, widgetAreaSlug, options = {} ) => {
				invariant(
					widgetAreaSlug,
					'widgetAreaSlug is required to check a widget area is active.'
				);

				const { modules } = options;

				const widgetArea =
					select( CORE_WIDGETS ).getWidgetArea( widgetAreaSlug );

				let areaWidgets = select( CORE_WIDGETS ).getWidgets(
					widgetAreaSlug,
					{ modules }
				);

				if ( widgetArea.filterActiveWidgets ) {
					areaWidgets = widgetArea.filterActiveWidgets(
						select,
						areaWidgets
					);
				}

				return areaWidgets.some( ( widget ) =>
					select( CORE_WIDGETS ).isWidgetActive( widget.slug )
				);
			}
	),

	/**
	 * Checks if a widget area has been registered.
	 *
	 * Returns `true` if the widget area has been registered.
	 * Returns `false` if the widget area has NOT been registered.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Widget Area's slug.
	 * @return {boolean} `true`/`false` based on whether widget area has been registered.
	 */
	isWidgetAreaRegistered( state, slug ) {
		const { areas } = state;

		return areas[ slug ] !== undefined;
	},

	/**
	 * Returns all widget areas registered for a given context.
	 *
	 * Returns an array of all widget areas for a given context.
	 * The widget areas are returned in order of their priority, so can be rendered in
	 * the order provided by the selector.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state       Data store's state.
	 * @param {string} contextSlug Widget context to get areas for.
	 * @return {Array} An ordered array of widget areas for this context.
	 */
	getWidgetAreas( state, contextSlug ) {
		invariant( contextSlug, 'contextSlug is required.' );

		const { areas, contextAssignments } = state;

		return sortByProperty(
			Object.values( areas ).filter( ( area ) => {
				return (
					contextAssignments[ contextSlug ] &&
					contextAssignments[ contextSlug ].includes( area.slug )
				);
			} ),
			'priority'
		);
	},

	/**
	 * Returns a widget area based on slug.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @param {string} slug  Widget area to select.
	 * @return {Object|null} A widget area if one is found with a matching slug.
	 */
	getWidgetArea( state, slug ) {
		invariant( slug, 'slug is required.' );

		const { areas } = state;

		return areas[ slug ] || null;
	},
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
