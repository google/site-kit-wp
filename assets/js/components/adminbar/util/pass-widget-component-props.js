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
import { getWidgetComponentProps } from '../../../googlesitekit/widgets/util';

/**
 * Gets the props to pass to a widget's component.
 *
 * @since n.e.x.t
 *
 * @param {string} widgetSlug The slug of the widget.
 * @return {Function} Enhancing function that adds the getWidgetComponentProps to the passed component.
 */
export const passWidgetComponentProps = ( { widgetSlug } ) => {
	return ( wrappedComponent ) => {
		const AdminBarWidgetComponent = ( props ) => {
			// Add the widget component props to the component so that we can use the WidgetReportZero component when there is zero data.
			const widgetComponentProps = getWidgetComponentProps( widgetSlug );

			return createElement( wrappedComponent, { ...props, ...widgetComponentProps } );
		};
		return AdminBarWidgetComponent;
	};
};
