/**
 * Key Metrics utility functions.
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
 * External dependencies.
 */
import propTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { trackEvent } from '../../util';

export function conversionReportingDetectedEventsTracking(
	{
		shouldShowInitialCalloutForTailoredMetrics,
		shouldShowCalloutForUserPickedMetrics,
		shouldShowCalloutForNewEvents,
		userPickedMetrics,
	},
	viewContext,
	eventName
) {
	let category = '';

	// Handle internal tracking or the initial detection of events with tailored KMW selection.
	if ( shouldShowInitialCalloutForTailoredMetrics ) {
		category = `${ viewContext }_kmw-tailored-conversion-events-detected-notification`;
	}

	// Handle internal tracking or the initial detection of events with manual KMW selection.
	if ( shouldShowCalloutForUserPickedMetrics ) {
		category = `${ viewContext }_kmw-manual-conversion-events-detected-notification`;
	}

	// Handle internal tracking for new events with manual KMW selection.
	if ( shouldShowCalloutForNewEvents && userPickedMetrics?.length ) {
		category = `${ viewContext }_kmw-manual-new-conversion-events-detected-notification`;
	}

	// Handle internal tracking for new events with tailored KMW selection.
	if ( shouldShowCalloutForNewEvents && ! userPickedMetrics?.length ) {
		category = `${ viewContext }_kmw-tailored-new-conversion-events-detected-notification`;
	}

	if ( category ) {
		trackEvent( category, eventName, 'conversion_reporting' );
	}
}

conversionReportingDetectedEventsTracking.propTypes = {
	shouldShowInitialCalloutForTailoredMetrics: propTypes.bool.isRequired,
	shouldShowCalloutForUserPickedMetrics: propTypes.bool.isRequired,
	shouldShowCalloutForNewEvents: propTypes.bool.isRequired,
	userPickedMetrics: propTypes.object.isRequired,
	viewContext: propTypes.string.isRequired,
	eventName: propTypes.string.isRequired,
};
