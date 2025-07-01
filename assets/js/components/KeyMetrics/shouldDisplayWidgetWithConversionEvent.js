/**
 * Key Metrics shouldDisplayWidgetWithConversionEvent function.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

/**
 * Determines whether to display a widget that requires conversion reporting events
 * in the key metrics selection panel.
 *
 * This function is attached to the widget object that requires the conversion reporting events and
 * has the `requiredConversionEventName` property.
 *
 * @since 1.136.0
 * @since 1.137.0 Moved function to its own file.
 *
 * @param {Object}   options        Options object.
 * @param {Function} options.select Data store select function.
 * @param {string}   options.slug   Key metric widget slug.
 * @return {boolean} Whether to display the widget.
 */
export function shouldDisplayWidgetWithConversionEvent( { select, slug } ) {
	return (
		select( MODULES_ANALYTICS_4 ).hasConversionReportingEvents(
			// This property is available to the widget object that requires the
			// conversion reporting events, where the function is attached.
			this.requiredConversionEventName
		) || select( CORE_USER ).isKeyMetricActive( slug )
	);
}
