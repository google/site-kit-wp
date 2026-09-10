/**
 * Widgets component props utilities.
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
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Widget from '@/js/googlesitekit/widgets/components/Widget';
import WidgetNull from '@/js/googlesitekit/widgets/components/WidgetNull';
import WidgetRecoverableModules from '@/js/googlesitekit/widgets/components/WidgetRecoverableModules';
import WidgetReportError from '@/js/googlesitekit/widgets/components/WidgetReportError';
import WidgetReportZero from '@/js/googlesitekit/widgets/components/WidgetReportZero';
import WPDashboardReportError from '@/js/googlesitekit/widgets/components/WPDashboardReportError';

/**
 * Widget props type.
 *
 * @since 1.179.0
 *
 * @typedef {Object} WidgetComponentProps
 * @property {string} widgetSlug The widget's slug.
 * @property {WPComponent} Widget The `Widget` component, pre-bound to this widget's slug.
 * @property {WPComponent} WidgetRecoverableModules The `WidgetRecoverableModules` component, pre-bound to this widget's slug.
 * @property {WPComponent} WidgetReportZero The `WidgetReportZero` component, pre-bound to this widget's slug.
 * @property {WPComponent} WidgetReportError The `WidgetReportError` component, pre-bound to this widget's slug.
 * @property {WPComponent} WidgetNull The `WidgetNull` component, pre-bound to this widget's slug.
 */

/**
 * Builds the widget-scoped component props for a single widget.
 *
 * `withWidgetSlug()` wraps each component in `forwardRef`, which TypeScript
 * would otherwise use to infer a stricter type than the `WidgetComponentProps`
 * type declared below. Declaring that return type here forces TypeScript to
 * use it instead, so TS widget components (e.g. `WidgetNull`) don't fail to
 * type-check.
 *
 * @since n.e.x.t
 *
 * @param {string} widgetSlug The widget's slug.
 * @return {WidgetComponentProps} The widget-scoped component props.
 */
function buildWidgetComponentProps( widgetSlug ) {
	return {
		widgetSlug,
		Widget: withWidgetSlug( widgetSlug )( Widget ),
		WidgetRecoverableModules: withWidgetSlug( widgetSlug )(
			WidgetRecoverableModules
		),
		WidgetReportZero: withWidgetSlug( widgetSlug )( WidgetReportZero ),
		WidgetReportError: withWidgetSlug( widgetSlug )( WidgetReportError ),
		WidgetNull: withWidgetSlug( widgetSlug )( WidgetNull ),
	};
}

/**
 * Gets the props to pass to a widget's component.
 *
 * @since 1.25.0
 * @since 1.107.0 Added `widgetSlug` to the returned props.
 *
 * @param {string} widgetSlug The widget's slug.
 * @return {WidgetComponentProps} Props to pass to the widget component.
 */
export const getWidgetComponentProps = memize( buildWidgetComponentProps );

function withWidgetSlug( widgetSlug ) {
	return ( WrappedComponent ) => {
		const WithWidgetSlug = forwardRef( ( props, ref ) => {
			return (
				<WrappedComponent
					{ ...props }
					ref={ ref }
					widgetSlug={ widgetSlug }
				/>
			);
		} );
		WithWidgetSlug.displayName = 'WithWidgetSlug';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WithWidgetSlug.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return WithWidgetSlug;
	};
}

/**
 * Gets the props and passes them to the widget's component through a HOC.
 *
 * @since 1.26.0
 *
 * @param {string} widgetSlug The slug of the widget.
 * @return {Function} Enhancing function that adds the getWidgetComponentProps to the passed component.
 */
export function withWidgetComponentProps( widgetSlug ) {
	const widgetComponentProps = getWidgetComponentProps( widgetSlug );
	return ( WrappedComponent ) => {
		function DecoratedComponent( props ) {
			return (
				<WrappedComponent { ...props } { ...widgetComponentProps } />
			);
		}
		DecoratedComponent.displayName = 'WithWidgetComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			DecoratedComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return DecoratedComponent;
	};
}

/**
 * Gets the props and passes them to the WP Dashboard widget's component through a HOC.
 *
 * @since 1.114.0
 *
 * @param {string} widgetSlug The slug of the widget.
 * @return {Function} Enhancing function that adds the WP Dashboard specific
 *                    props to the passed component.
 */
export function withWPDashboardWidgetComponentProps( widgetSlug ) {
	return ( WrappedComponent ) => {
		function DecoratedComponent( props ) {
			return (
				<WrappedComponent
					{ ...props }
					WPDashboardReportError={ withWidgetSlug( widgetSlug )(
						WPDashboardReportError
					) }
				/>
			);
		}
		DecoratedComponent.displayName = 'WithWPDashboardWidgetComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			DecoratedComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return DecoratedComponent;
	};
}
