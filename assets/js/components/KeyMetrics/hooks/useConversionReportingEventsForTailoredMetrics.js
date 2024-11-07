/**
 * Change metrics feature tour hook.
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
import {
	CORE_USER,
	getKeyMetricsConversionEventWidgets,
} from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';

/**
 * Checks if there are key metrics widgets connected with the detected events for the supplied purpose answer.
 *
 * @since n.e.x.t
 *
 * @param {string}  purpose      Value of saved site purpose from user input settings.
 * @param {boolean} useNewEvents Flag inclusion of detected new events, otherwise initial detected events will be used.
 * @return {boolean} TRUE if current site purpose will have any ACR key metrics widgets assigned to it, FALSE otherwise.
 */
export const useConversionReportingEventsForTailoredMetrics = (
	purpose,
	useNewEvents
) => {
	const purposeTailoredMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getAnswerBasedMetrics( purpose, true )
	);
	const conversionEventWidgets = getKeyMetricsConversionEventWidgets();
	const conversionReportingEventsChange = useSelect( ( select ) => {
		if ( ! purpose ) {
			return undefined;
		}

		if ( useNewEvents ) {
			return select(
				MODULES_ANALYTICS_4
			).getConversionReportingEventsChange()?.newEvents;
		}

		return select( MODULES_ANALYTICS_4 ).getDetectedEvents();
	} );

	return conversionReportingEventsChange?.reduce( ( acc, event ) => {
		// If a match has already been found, no need to continue.
		if ( acc ) {
			return true;
		}

		// Check if any item in conversionEventWidgets exists in purposeTailoredMetrics.
		return conversionEventWidgets[ event ].some( ( widget ) =>
			purposeTailoredMetrics.includes( widget )
		);
	}, false );
};
