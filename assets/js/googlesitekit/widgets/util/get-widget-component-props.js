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
 * Internal dependencies
 */
import Widget from '../components/Widget';
import WidgetReportZero from '../components/WidgetReportZero';
import WidgetReportError from '../components/WidgetReportError';
import WidgetNull from '../components/WidgetNull';
import WidgetRecoverableModules from '../components/WidgetRecoverableModules';
import WPDashboardReportError from '../components/WPDashboardReportError';

/**
 * Gets the props to pass to a widget's component.
 *
 * @since 1.25.0
 * @since 1.107.0 Added `widgetSlug` to the returned props.
 *
 * @param {string} widgetSlug The widget's slug.
 * @return {Object} Props to pass to the widget component.
 */
export const getWidgetComponentProps = memize( ( widgetSlug ) => {
	// Scope widget-specific components to the widget instance so that the
	// component does not need to (re-)specify the widget slug.
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
} );

function withWidgetSlug( widgetSlug ) {
	return ( WrappedComponent ) => {
		const WithWidgetSlug = ( props ) => (
			<WrappedComponent { ...props } widgetSlug={ widgetSlug } />
		);
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
export const withWidgetComponentProps = ( widgetSlug ) => {
	const widgetComponentProps = getWidgetComponentProps( widgetSlug );
	return ( WrappedComponent ) => {
		const DecoratedComponent = ( props ) => (
			<WrappedComponent { ...props } { ...widgetComponentProps } />
		);
		DecoratedComponent.displayName = 'WithWidgetComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			DecoratedComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return DecoratedComponent;
	};
};

/**
 * Gets the props and passes them to the WP Dashboard widget's component through a HOC.
 *
 * @since n.e.x.t
 *
 * @param {string} widgetSlug The slug of the widget.
 * @return {Function} Enhancing function that adds the WP Dashboard specific
 *                    props to the passed component.
 */
export const withWPDashboardWidgetComponentProps = ( widgetSlug ) => {
	return ( WrappedComponent ) => {
		const DecoratedComponent = ( props ) => (
			<WrappedComponent
				{ ...props }
				WPDashboardReportError={ withWidgetSlug( widgetSlug )(
					WPDashboardReportError
				) }
			/>
		);
		DecoratedComponent.displayName = 'WithWPDashboardWidgetComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			DecoratedComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}
		return DecoratedComponent;
	};
};
