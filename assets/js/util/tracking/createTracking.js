/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { once } from 'lodash';

/**
 * Internal dependencies
 */
import createInitializeSnippet from './createInitializeSnippet';
import createTrackEvent from './createTrackEvent';

const DEFAULT_CONFIG = {
	activeModules: [],
	isAuthenticated: false,
	referenceSiteURL: '',
	trackingEnabled: false,
	trackingID: '',
	userIDHash: '',
	userRoles: [],
};

/**
 * Initializes tracking.
 *
 * @since 1.3.0
 *
 * @param {Object} newConfig       New configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @param {Object} _global         The global window object.
 * @return {Object} Tracking config.
 */
export default function createTracking(
	newConfig,
	dataLayerTarget = global,
	_global = global
) {
	const config = {
		...DEFAULT_CONFIG,
		...newConfig,
	};
	// Remove any trailing slash from the reference URL.
	if ( config.referenceSiteURL ) {
		config.referenceSiteURL = config.referenceSiteURL
			.toString()
			.replace( /\/+$/, '' );
	}
	const initializeSnippet = createInitializeSnippet(
		config,
		dataLayerTarget
	);

	const trackEvent = createTrackEvent(
		config,
		dataLayerTarget,
		initializeSnippet,
		_global
	);

	const onceTrackedEventsMap = {};

	const trackEventOnce = ( ...params ) => {
		const key = JSON.stringify( params );
		if ( ! onceTrackedEventsMap[ key ] ) {
			onceTrackedEventsMap[ key ] = once( trackEvent );
		}

		onceTrackedEventsMap[ key ]( ...params );
	};

	return {
		enableTracking: function enableTracking() {
			config.trackingEnabled = true;
		},
		disableTracking: function disableTracking() {
			config.trackingEnabled = false;
		},
		initializeSnippet,
		isTrackingEnabled: function isTrackingEnabled() {
			return !! config.trackingEnabled;
		},
		trackEvent,
		trackEventOnce,
	};
}
