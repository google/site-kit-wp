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
import {
	WIDGET_STYLES,
	CONTEXT_DASHBOARD,
	CONTEXT_PAGE_DASHBOARD,
} from './constants';

/**
 * Store our widget components by registry, then by widget `slug`. We do this because
 * we can't store React components in our data store.
 *
 * @private
 * @since 1.9.0
 */
export const WidgetComponents = {};

const ASSIGN_WIDGET_AREA = 'ASSIGN_WIDGET_AREA';
const REGISTER_WIDGET_AREA = 'REGISTER_WIDGET_AREA';

const WidgetStyleKeys = Object.keys( WIDGET_STYLES ).map( ( ( key ) => `WIDGET_STYLES.${ key }` ) ).join( ', ' );

export const INITIAL_STATE = {
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
				contextSlugs: ( typeof contextSlugs === 'string' ) ? [ contextSlugs ] : contextSlugs,
			},
			type: ASSIGN_WIDGET_AREA,
		};
	},

	/**
	 * Creates a widget area with a given name and settings.
	 *
	 * @since 1.9.0
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
		style = WIDGET_STYLES.BOXES,
		title,
		subtitle,
		icon,
	} = {} ) {
		invariant( slug, 'slug is required.' );
		invariant( title, 'settings.title is required.' );
		invariant( subtitle, 'settings.subtitle is required.' );
		invariant( Object.values( WIDGET_STYLES ).includes( style ), `settings.style must be one of: ${ WidgetStyleKeys }.` );

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

			const { contextAssignments } = state;
			contextSlugs.forEach( ( contextSlug ) => {
				if ( contextAssignments[ contextSlug ] === undefined ) {
					contextAssignments[ contextSlug ] = [];
				}

				if ( ! contextAssignments[ contextSlug ].includes( slug ) ) {
					contextAssignments[ contextSlug ].push( slug );
				}
			} );

			return {
				...state,
				contextAssignments,
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
	/**
	 * Defines default widget areas for a given context.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} contextSlug Widget context to get areas for.
	 */
	*getWidgetAreas( contextSlug ) {
		if ( contextSlug === CONTEXT_DASHBOARD || contextSlug === CONTEXT_PAGE_DASHBOARD ) {
			yield actions.registerWidgetArea( `${ contextSlug }AllTraffic`, {
				title: 'All Triffic',
				subtitle: 'How people found your site.',
			} );

			yield actions.registerWidgetArea( `${ contextSlug }SearchFunnel`, {
				title: 'Search Funnel',
				subtitle: 'How your site appeared in Search results and how many visitors you got from Search.',
			} );

			yield actions.registerWidgetArea( `${ contextSlug }Popularity`, {
				title: 'Popularity',
				subtitle: 'Your most popular pages and how people found them from Search.',
			} );

			yield actions.registerWidgetArea( `${ contextSlug }Speed`, {
				title: 'Page Speed and Experience',
				subtitle: 'How fast your home page loads, how quickly people can interact with your content, and how stable your content is.',
			} );

			yield actions.registerWidgetArea( `${ contextSlug }Earnings`, {
				title: 'Earnings',
				subtitle: 'How much your site earns.',
			} );

			yield actions.assignWidgetArea( `${ contextSlug }AllTraffic`, contextSlug );
			yield actions.assignWidgetArea( `${ contextSlug }SearchFunnel`, contextSlug );
			yield actions.assignWidgetArea( `${ contextSlug }Popularity`, contextSlug );
			yield actions.assignWidgetArea( `${ contextSlug }Speed`, contextSlug );
			yield actions.assignWidgetArea( `${ contextSlug }Earnings`, contextSlug );
		}
	},
};

export const selectors = {
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

		return Object.values( areas ).filter( ( area ) => {
			return contextAssignments[ contextSlug ] && contextAssignments[ contextSlug ].includes( area.slug );
		} ).sort( ( areaA, areaB ) => areaA.priority - areaB.priority );
	},

	/**
	 * Returns a widget area based on slug.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state  Data store's state.
	 * @param {string} slug   Widget area to select.
	 * @return {Object|null} A widget area if one is found with a matching slug.
	 */
	getWidgetArea( state, slug ) {
		invariant( slug, 'slug is required.' );

		const { areas } = state;

		return areas[ slug ] || null;
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
