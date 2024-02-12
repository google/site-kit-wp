/**
 * Event tracking utilities.
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
 * Internal dependencies
 */
import createTracking from './createTracking';

const {
	activeModules = [],
	isSiteKitScreen,
	trackingEnabled,
	trackingID,
	referenceSiteURL,
	userIDHash,
	isAuthenticated,
	userRoles,
} = global._googlesitekitTrackingData || {};

const { GOOGLESITEKIT_VERSION: pluginVersion } = global;

const initialConfig = {
	activeModules,
	trackingEnabled,
	trackingID,
	trackingID_GA4: 'G-EQDN3BWDSD',
	referenceSiteURL,
	userIDHash,
	isSiteKitScreen,
	userRoles,
	isAuthenticated,
	pluginVersion,
};

const {
	enableTracking,
	disableTracking,
	isTrackingEnabled,
	initializeSnippet,
	trackEvent,
	trackEventOnce,
} = createTracking( initialConfig );

/**
 * Changes the active state of tracking.
 *
 * @since 1.3.0
 *
 * @param {boolean} activeStatus The new state to set.
 */
function toggleTracking( activeStatus ) {
	if ( !! activeStatus ) {
		enableTracking();
	} else {
		disableTracking();
	}
}

// Bootstrap on import if tracking is allowed.
if ( isSiteKitScreen && trackingEnabled ) {
	initializeSnippet();
}

export {
	enableTracking,
	disableTracking,
	isTrackingEnabled,
	toggleTracking,
	trackEvent,
	trackEventOnce,
};
