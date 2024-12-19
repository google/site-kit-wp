/**
 * Determines whether the new events callout should be displayed to the user.
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
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';

/**
 * Determines whether the new events callout should be displayed.
 *
 * @since n.e.x.t
 *
 * @param {boolean} haveNewConversionEventsAfterDismiss If there are new events detected after callout was dismissed.
 * @return {boolean} Whether the new events callout should be displayed.
 */
export default function useDisplayNewEventsCalloutAfterInitialDetection(
	haveNewConversionEventsAfterDismiss
) {
	return useSelect( ( select ) => {
		const isKeyMetricsSetupCompleted =
			select( CORE_SITE ).isKeyMetricsSetupCompleted();

		const haveConversionEventsWithDifferentMetrics =
			select(
				MODULES_ANALYTICS_4
			).haveConversionEventsWithDifferentMetrics();

		return (
			isKeyMetricsSetupCompleted &&
			haveConversionEventsWithDifferentMetrics &&
			haveNewConversionEventsAfterDismiss
		);
	} );
}
