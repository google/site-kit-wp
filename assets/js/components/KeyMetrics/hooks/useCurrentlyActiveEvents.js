/**
 * The useCurrentlyActiveEvents hook.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies.
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

/**
 * Gets the list of currently active conversion events based on user selection
 * or user input settings.
 *
 * @since n.e.x.t
 *
 * @return {Array<string>|undefined} List of currently active conversion events.
 */
export default function useCurrentlyActiveEvents() {
	return useSelect( ( select ) => {
		const userPickedMetrics = select( CORE_USER ).getUserPickedMetrics();

		if ( userPickedMetrics?.length ) {
			// Safe to access without GA4 connection; no network request.
			const keyMetricsConversionEventWidgets =
				select(
					MODULES_ANALYTICS_4
				).getKeyMetricsConversionEventWidgets();

			return Object.keys( keyMetricsConversionEventWidgets ).filter(
				( event ) =>
					userPickedMetrics.some( ( metric ) =>
						keyMetricsConversionEventWidgets[ event ].includes(
							metric
						)
					)
			);
		}

		const userInputSettings = select( CORE_USER ).getUserInputSettings();
		return userInputSettings?.includeConversionEvents?.values;
	} );
}
