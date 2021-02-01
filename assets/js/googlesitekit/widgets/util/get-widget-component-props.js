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
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WidgetReportZero from '../components/WidgetReportZero';
import WidgetActivateModuleCTA from '../components/WidgetActivateModuleCTA';
import WidgetCompleteModuleActivationCTA from '../components/WidgetCompleteModuleActivationCTA';

/**
 * Gets the props to pass to a widget's component.
 *
 * @since 1.25.0
 *
 * @param {string} widgetSlug The widget's slug.
 * @return {Object} Props to pass to the widget component.
 */
export function getWidgetComponentProps( widgetSlug ) {
	// Scope widget-specific components to the widget instance so that the
	// component does not need to (re-)specify the widget slug.
	return {
		WidgetReportZero: withWidgetSlug( widgetSlug )( WidgetReportZero ),
		WidgetActivateModuleCTA: withWidgetSlug( widgetSlug )( WidgetActivateModuleCTA ),
		WidgetCompleteModuleActivationCTA: withWidgetSlug( widgetSlug )( WidgetCompleteModuleActivationCTA ),
	};
}

function withWidgetSlug( widgetSlug ) {
	return ( WrappedComponent ) => {
		const WithWidgetSlug = ( props ) => <WrappedComponent { ...props } widgetSlug={ widgetSlug } />;
		WithWidgetSlug.displayName = 'WithWidgetSlug';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WithWidgetSlug.displayName += `(${ WrappedComponent.displayName || WrappedComponent.name })`;
		}
		return WithWidgetSlug;
	};
}

/**
 * Gets the props and passes them to the widget's component through a HOC.
 *
 * @since n.e.x.t
 *
 * @param {string} widgetSlug The slug of the widget.
 * @return {Function} Enhancing function that adds the getWidgetComponentProps to the passed component.
 */
export const withWidgetComponentProps = ( { widgetSlug } ) => {
	return ( WrappedComponent ) => {
		const WidgetWithProps = ( props ) => {
			// Add the widget component props to the component so that we can use the WidgetReportZero component when there is zero data.
			const widgetComponentProps = getWidgetComponentProps( widgetSlug );

			return createElement( WrappedComponent, { ...props, ...widgetComponentProps } );
		};
		WidgetWithProps.displayName = 'WidgetWithComponentProps';
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WidgetWithProps.displayName += `(${ WrappedComponent.displayName || WrappedComponent.name })`;
		}
		return WidgetWithProps;
	};
};
