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
 * The promise created when tracking is enabled.
 * This reference is kept and returned for subsequent calls.
 */
let enableTrackingPromise;

/**
 * Initializes tracking.
 *
 * @param {Object} _baseData Site Kit base data. (Optional - for testing only)
 * @param {boolean} _resetPromise Clears the internal reference to the enableTrackingPromise (Optional - for testing only)
 */
export async function bootstrapTracking( _baseData = global._googlesitekitBase, _resetPromise = false ) {
	const {
		isFirstAdmin,
		trackingID,
		trackingEnabled,
		referenceSiteURL,
		userIDHash,
	} = _baseData;

	Object.assign( config, DEFAULT_CONFIG, {
		isFirstAdmin,
		trackingID,
		trackingEnabled,
		userIDHash,
		// Remove any trailing slash from the reference URL.
		referenceSiteURL: referenceSiteURL.toString().replace( /\/+$/, '' ),
	} );

	if ( _resetPromise ) {
		enableTrackingPromise = null;
	}

	return toggleTracking( trackingEnabled );
}

/**
 * Change the active state of tracking.
 *
 * @param {boolean} activeStatus The new state to set.
 * @return {Promise} A promise that resolves with an object { trackingEnabled: (bool) }.
 */
export async function toggleTracking( activeStatus ) {
	if ( !! activeStatus ) {
		return enableTracking();
	}

	return disableTracking();
}

/**
 * Enables tracking by injecting the necessary script tag if not present.
 *
 * @return {Promise} A promise that resolves when the script is loaded and ready.
 */
export async function enableTracking() {
	// Return the existing promise if already called.
	if ( enableTrackingPromise ) {
		return enableTrackingPromise;
	}

	config.trackingEnabled = true;

	// If the script is already in the DOM then we shouldn't get here as the promise should already be returned.
	if ( document.querySelector( 'script[data-googlesitekit-gtag]' ) ) {
		enableTrackingPromise = Promise.resolve( { trackingEnabled: true } );
	} else { // If not present, inject it and resolve promise on load
		const scriptTag = document.createElement( 'script' );
		enableTrackingPromise = new Promise( ( resolve, reject ) => {
			scriptTag.onload = () => resolve( { trackingEnabled: true } );
			scriptTag.onerror = reject;
		} );
		scriptTag.setAttribute( 'data-googlesitekit-gtag', '' );
		scriptTag.async = true;
		scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID }`;
		document.head.appendChild( scriptTag );
	}

	return enableTrackingPromise;
}

/**
 * Disables subsequent event tracking.
 *
 * @return {Promise} A promise that resolves with an object { trackingEnabled: (bool) }.
 */
export async function disableTracking() {
	config.trackingEnabled = false;

	return Promise.resolve( { trackingEnabled: false } );
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
 * @param {Object} _global The global object. Optional. (Used for testing only)
 */
export function trackEvent( eventCategory, eventName, eventLabel = '', eventValue = '', _global = global ) {
	const {
		isFirstAdmin,
		referenceSiteURL,
		trackingID,
		userIDHash,
	} = config;

	if ( ! isTrackingEnabled() ) {
		return;
	}

	_global.dataLayer = _global.dataLayer || [];
	const gtag = ( ...args ) => _global.dataLayer.push( args );

	gtag( 'event', eventName, {
		send_to: trackingID,
		event_category: eventCategory,
		event_label: eventLabel,
		event_value: eventValue,
		dimension1: referenceSiteURL,
		dimension2: isFirstAdmin ? 'true' : 'false',
		dimension3: userIDHash,
	} );
}
