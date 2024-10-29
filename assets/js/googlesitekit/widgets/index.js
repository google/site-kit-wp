/**
 * Widgets API
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
 * Internal dependencies
 */
import {
	CORE_WIDGETS,
	WIDGET_WIDTHS,
	WIDGET_AREA_STYLES,
} from './datastore/constants';

export { registerStore } from './datastore';
export { registerDefaults as registerWidgets } from './register-defaults';

/**
 * Creates a new instance of Widgets.
 *
 * @since 1.26.0
 *
 * @param {Object}   registry          Datastore registry.
 * @param {Function} registry.select   Registry select function.
 * @param {Function} registry.dispatch Registry dispatch function.
 * @return {Object} Widgets instance.
 */
export function createWidgets( registry ) {
	const { dispatch, select } = registry;

	const Widgets = {
		/**
		 * Supported styles for Site Kit widget areas.
		 *
		 * @since 1.13.0
		 */
		WIDGET_AREA_STYLES,

		/**
		 * Supported widths for Site Kit widgets.
		 *
		 * @since 1.13.0
		 */
		WIDGET_WIDTHS,

		/**
		 * Registers a widget area.
		 *
		 * @since 1.9.0
		 *
		 * @param {string}         slug                Widget area's slug.
		 * @param {Object}         settings            Widget area's settings.
		 * @param {string}         settings.title      Title for this widget area.
		 * @param {string}         settings.subtitle   Subtitle for this widget area.
		 * @param {number}         [settings.priority] Optional. Priority for this widget area. Default: 10.
		 * @param {WPComponent}    settings.Icon       Optional. React component to render icon for this widget area.
		 * @param {string}         [settings.style]    Optional. Widget area style (one of "boxes", "composite"). Default: "boxes".
		 * @param {(string|Array)} [contextSlugs]      Optional. Widget context slug(s).
		 */
		registerWidgetArea( slug, settings, contextSlugs ) {
			dispatch( CORE_WIDGETS ).registerWidgetArea( slug, settings );
			if ( contextSlugs ) {
				Widgets.assignWidgetArea( slug, contextSlugs );
			}
		},

		/**
		 * Registers a widget.
		 *
		 * @since 1.9.0
		 *
		 * @param {string}                slug                         Widget's slug.
		 * @param {Object}                settings                     Widget's settings.
		 * @param {WPComponent}           settings.Component           React component used to display the contents of this widget.
		 * @param {number}                [settings.priority]          Optional. Widget's priority for ordering (lower number is higher priority, like WordPress hooks). Default is: 10.
		 * @param {string|Array.<string>} [settings.width]             Optional. Widget's maximum width to occupy. Default is: "quarter". One of: "quarter", "half", "full".
		 * @param {boolean}               [settings.wrapWidget]        Optional. Whether to wrap the component with the <Widget> wrapper. Default is: true.
		 * @param {string|Array.<string>} [settings.modules]           Optional. Widget's associated moduels.
		 * @param {Array.<string>}        [settings.hideOnBreakpoints] Optional. Hide widget on selected breakpoints. Array with any of: `BREAKPOINT_SMALL`, `BREAKPOINT_TABLET`, `BREAKPOINT_DESKTOP`, `BREAKPOINT_XLARGE`.
		 * @param {(string|Array)}        [widgetAreaSlugs]            Optional. Widget area slug(s).
		 */
		registerWidget( slug, settings, widgetAreaSlugs ) {
			dispatch( CORE_WIDGETS ).registerWidget( slug, settings );
			if ( widgetAreaSlugs ) {
				Widgets.assignWidget( slug, widgetAreaSlugs );
			}
		},

		/**
		 * Assigns a widget area to one (or several) contexts.
		 *
		 * Accepts an area slug to register as the first argument, then either a string
		 * (for a single context slug) or array of contexts slugs (to assign the widget area
		 * to multiple contexts).
		 *
		 * @since 1.9.0
		 *
		 * @param {string}            slug         Widget Area's slug.
		 * @param {(string|string[])} contextSlugs Widget context slug(s).
		 */
		assignWidgetArea( slug, contextSlugs ) {
			dispatch( CORE_WIDGETS ).assignWidgetArea( slug, contextSlugs );
		},

		/**
		 * Assigns an existing widget (by slug) to a widget area(s).
		 *
		 * @since 1.9.0
		 *
		 * @param {string}            slug            Widget slug.
		 * @param {(string|string[])} widgetAreaSlugs Widget area slug(s).
		 */
		assignWidget( slug, widgetAreaSlugs ) {
			dispatch( CORE_WIDGETS ).assignWidget( slug, widgetAreaSlugs );
		},

		/**
		 * Checks if a widget area has been registered.
		 *
		 * Returns `true` if the widget area has been registered.
		 * Returns `false` if the widget area has NOT been registered.
		 *
		 * @since 1.9.0
		 *
		 * @param {string} slug Widget Area's slug.
		 * @return {boolean} `true`/`false` based on whether widget area has been registered.
		 */
		isWidgetAreaRegistered( slug ) {
			return select( CORE_WIDGETS ).isWidgetAreaRegistered( slug );
		},

		/**
		 * Checks if a widget has been registered with a given slug.
		 *
		 * Returns `true` if the widget area has been registered.
		 * Returns `false` if the widget area has NOT been registered.
		 *
		 * @since 1.9.0
		 *
		 * @param {string} slug Widget's slug.
		 * @return {boolean} `true`/`false` based on whether widget has been registered.
		 */
		isWidgetRegistered( slug ) {
			return select( CORE_WIDGETS ).isWidgetRegistered( slug );
		},
	};
	return Widgets;
}
