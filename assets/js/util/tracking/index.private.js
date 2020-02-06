/**
 * Event tracking utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Global object reference.
 */
let _global = {};

const DEFAULT_CONFIG = {
	isFirstAdmin: false,
	trackingEnabled: false,
	trackingID: '',
	referenceSiteURL: '',
	userIDHash: '',
};

/**
 * Tracking configuration.
 */
const config = { ...DEFAULT_CONFIG };

/**
 * gtag script identifier.
 */
const SCRIPT_IDENTIFIER = 'data-googlesitekit-gtag';

/**
 * Data layer global used for internal/private Site Kit data.
 */
export const DATA_LAYER = '_googlesitekitDataLayer';

/**
 * Initializes tracking.
 *
 * @param {Object} _window The global object. Optional. (Used for testing only)
 */
export function bootstrapTracking( _window = global ) {
	_global = _window;

	const {
		isFirstAdmin,
		trackingID,
		trackingEnabled,
		referenceSiteURL,
		userIDHash,
	} = { ...DEFAULT_CONFIG, ..._global._googlesitekitBase };

	Object.assign( config, DEFAULT_CONFIG, {
		isFirstAdmin,
		trackingID,
		trackingEnabled,
		userIDHash,
		// Remove any trailing slash from the reference URL.
		referenceSiteURL: referenceSiteURL.toString().replace( /\/+$/, '' ),
	} );

	toggleTracking( trackingEnabled );
}

/**
 * Change the active state of tracking.
 *
 * @param {boolean} activeStatus The new state to set.
 */
export function toggleTracking( activeStatus ) {
	if ( !! activeStatus ) {
		enableTracking();
	} else {
		disableTracking();
	}
}

/**
 * Enables tracking by injecting the necessary script tag if not present.
 */
export function enableTracking() {
	config.trackingEnabled = true;

	const { document } = _global;

	if ( document.querySelector( `script[${ SCRIPT_IDENTIFIER }]` ) ) {
		return;
	}

	// If not present, inject it and initialize dataLayer.
	const scriptTag = document.createElement( 'script' );
	scriptTag.setAttribute( SCRIPT_IDENTIFIER, '' );
	scriptTag.async = true;
	scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID }&l=${ DATA_LAYER }`;
	document.head.appendChild( scriptTag );

	dataLayerPush( 'js', new Date() );
	dataLayerPush( 'config', config.trackingID );
}

/**
 * Disables subsequent event tracking.
 */
export function disableTracking() {
	config.trackingEnabled = false;
}

/**
 * Returns the current active state of tracking.
 *
 * @return {boolean} Whether or not tracking is enabled.
 */
export function isTrackingEnabled() {
	return !! config.trackingEnabled;
}

/**
 * Send an Analytics tracking event.
 *
 * @param {string} eventCategory The event category. Required.
 * @param {string} eventName The event category. Required.
 * @param {string} eventLabel The event category. Optional.
 * @param {string} eventValue The event category. Optional.
 */
export function trackEvent( eventCategory, eventName, eventLabel = '', eventValue = '' ) {
	const {
		isFirstAdmin,
		referenceSiteURL,
		trackingID,
		userIDHash,
	} = config;

	if ( ! isTrackingEnabled() ) {
		return;
	}

	dataLayerPush( 'event', eventName, {
		send_to: trackingID,
		event_category: eventCategory,
		event_label: eventLabel,
		event_value: eventValue,
		dimension1: referenceSiteURL,
		dimension2: isFirstAdmin ? 'true' : 'false',
		dimension3: userIDHash,
	} );
}

/**
 * Pushes data onto the data layer.
 *
 * @param {...any} args Arguments to push onto the data layer.
 */
function dataLayerPush( ...args ) {
	_global[ DATA_LAYER ] = _global[ DATA_LAYER ] || [];
	_global[ DATA_LAYER ].push( args );
}
