/**
 * Analytics advanced tracking script to be inserted into the frontend via PHP.
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

// This file should not use any dependencies because it is used in the frontend.

/**
 * Internal dependencies
 */
import setUpAdvancedTracking from './analytics-advanced-tracking/set-up-advanced-tracking';

/**
 * Sends a tracking event to Analytics via gtag.
 *
 * @since 1.18.0
 *
 * @param {string} action   Event action / event name.
 * @param {Object} metadata Additional event metadata to send, or `null`.
 */
function sendEvent( action, metadata ) {
	window.gtag( 'event', action, metadata || undefined ); // eslint-disable-line no-restricted-globals
}

const events = window._googlesitekitAnalyticsTrackingData || []; // eslint-disable-line no-restricted-globals
if ( Array.isArray( events ) ) {
	setUpAdvancedTracking( events, sendEvent );
	// eslint-disable-next-line no-console
	console.log( 'Hello QA testing' );
}
