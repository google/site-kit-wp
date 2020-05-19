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
import { WIDGET_STYLES } from './constants';

/**
 * Store our widget components by registry, then by widget `slug`. We do this because
 * we can't store React components in our data store.
 *
 * @private
 * @since n.e.x.t
 */
export const WidgetComponents = {};

const ASSIGN_WIDGET_AREA = 'ASSIGN_WIDGET_AREA';
const REGISTER_WIDGET_AREA = 'REGISTER_WIDGET_AREA';

export const INITIAL_STATE = {
	areas: {},
	areaWidgets: {},
	contexts: {
		analytics: [],
		dashboard: [],
	},
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
	 * @since n.e.x.t
	 *
	 * @param {string}         slug         Widget Area's slug.
	 * @param {(string|Array)} contextSlugs Widget Context's slug(s).
	 * @return {Object} Redux-style action.
	 */
	assignWidgetArea( slug, contextSlugs ) {
		return {
			payload: {
				slug,
				contextSlugs: ( typeof contextSlugs === 'string' ) ? [ contextSlugs ] : contextSlugs,
			},
			type: ASSIGN_WIDGET_AREA,
		};
	},

	/**
	 * Creates a widget area with a given name and settings.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string}             slug               Widget Area's slug.
	 * @param {Object}             settings           Widget Area's settings.
	 * @param {string}             settings.title     Title for this widget area.
	 * @param {string}             settings.subtitle  Subtitle for this widget area.
	 * @param {string}             settings.icon      Optional. URL to SVG icon for this widget area.
	 * @param {string}             settings.style     Optional. Widget area style (one of "boxes", "composite"). Default: "boxes".
	 * @param {number}             settings.priority  Optional. Priority for this widget area. Default: 10.
	 * @return {Object} Redux-style action.
	 */
	registerWidgetArea( slug, {
		priority = 10,
		style = 'boxes',
		title,
		subtitle,
		icon,
	} = {} ) {
		invariant( slug, 'slug is required.' );
		invariant( title, 'settings.title is required.' );
		invariant( subtitle, 'settings.subtitle is required.' );
		invariant( WIDGET_STYLES.includes( style ), `settings.style must be one of: ${ WIDGET_STYLES.join( ', ' ) }.` );

		return {
			payload: {
				slug,
				settings: { priority, style, title, subtitle, icon },
			},
			type: REGISTER_WIDGET_AREA,
		};
	},
};

export const controls = {};

export const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case ASSIGN_WIDGET_AREA: {
			const { slug, contextSlugs } = payload;

			const { contexts } = state;
			contextSlugs.forEach( ( contextSlug ) => {
				if ( contexts[ contextSlug ] === undefined ) {
					return;
				}

				if ( ! contexts[ contextSlug ].includes( slug ) ) {
					contexts[ contextSlug ].push( slug );
				}
			} );

			return {
				...state,
				contexts,
			};
		}

		case REGISTER_WIDGET_AREA: {
			const { slug, settings } = payload;

			if ( state.areas[ slug ] !== undefined ) {
				global.console.warn( `Could not register widget area with slug "${ slug }". Widget area "${ slug }" is already registered.` );

				return { ...state };
			}

			return {
				...state,
				areas: {
					...state.areas,
					[ slug ]: { ...settings, slug },
				},
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
	 * Checks if a widget area has been registered.
	 *
	 * Returns `true` if the widget area has been registered.
	 * Returns `false` if the widget area has NOT been registered.
	 *
	 * @since n.e.x.t
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
	 * @since n.e.x.t
	 *
	 * @param {Object} state       Data store's state.
	 * @param {string} contextSlug Widget context to get areas for.
	 * @return {Array} An ordered array of widget areas for this context.
	 */
	getWidgetAreas( state, contextSlug ) {
		invariant( contextSlug, 'contextSlug is required.' );

		const { areas, contexts } = state;

		return Object.values( areas ).filter( ( area ) => {
			return contexts[ contextSlug ] && contexts[ contextSlug ].includes( area.slug );
		} ).sort( ( areaA, areaB ) => {
			return ( areaA.priority >= areaB.priority ) ? 1 : -1;
		} );
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
