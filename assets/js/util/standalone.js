/**
 * Utility functions with minimal dependencies (only 'wp-i18n').
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * WordPress dependencies
 */
import {
	_n,
	sprintf,
} from '@wordpress/i18n';

/**
 * Appends a notification count icon to the Site Kit dashboard menu/admin bar when
 * user is outside the Site Kit app.
 *
 * Retrieves the number from local storage previously stored by NotificationCounter
 * used in googlesitekit-admin.js
 */
export const appendNotificationsCount = ( count = 0 ) => {
	let menuSelector = null;
	let adminbarSelector = null;

	const counterMenu = document.querySelector( '#toplevel_page_googlesitekit-dashboard .googlesitekit-notifications-counter' );
	const counterAdminbar = document.querySelector( '#wp-admin-bar-google-site-kit .googlesitekit-notifications-counter' );

	if ( counterMenu && counterAdminbar ) {
		return false;
	}

	menuSelector = document.querySelector( '#toplevel_page_googlesitekit-dashboard .wp-menu-name' );
	adminbarSelector = document.querySelector( '#wp-admin-bar-google-site-kit .ab-item' );

	if ( null === menuSelector && null === adminbarSelector ) {
		return false;
	}

	const wrapper = document.createElement( 'span' );
	wrapper.setAttribute( 'class', `googlesitekit-notifications-counter update-plugins count-${ count }` );

	const pluginCount = document.createElement( 'span' );
	pluginCount.setAttribute( 'class', 'plugin-count' );
	pluginCount.setAttribute( 'aria-hidden', 'true' );
	pluginCount.textContent = count;

	const screenReader = document.createElement( 'span' );
	screenReader.setAttribute( 'class', 'screen-reader-text' );
	screenReader.textContent = sprintf(
		_n(
			'%d notification',
			'%d notifications',
			count,
			'google-site-kit'
		),
		count
	);

	wrapper.appendChild( pluginCount );
	wrapper.appendChild( screenReader );

	if ( menuSelector && null === counterMenu ) {
		menuSelector.appendChild( wrapper );
	}

	if ( adminbarSelector && null === counterAdminbar ) {
		adminbarSelector.appendChild( wrapper );
	}
	return wrapper;
};

/**
 * Clears session storage and local storage.
 *
 * Both of these should be cleared to make sure no Site Kit data is left in the
 * browser's cache regardless of which storage implementation is used.
 */
export const clearWebStorage = () => {
	if ( window.localStorage ) {
		window.localStorage.clear();
	}
	if ( window.sessionStorage ) {
		window.sessionStorage.clear();
	}
};

/**
 * Fallback helper to get a query parameter from the current URL.
 *
 * Used when URL.searchParams is unavailable.
 *
 * @param {string} name Query param to search for.
 * @return {string}
 */
const fallbackGetQueryParamater = ( name ) => {
	const queries = location.search.substr( 1 ).split( '&' );
	const queryDict = {};

	for ( let i = 0; i < queries.length; i++ ) {
		queryDict[ queries[ i ].split( '=' )[ 0 ] ] = decodeURIComponent( queries[ i ].split( '=' )[ 1 ] );
	}

	// If the name is specified, return that specific get parameter
	if ( name ) {
		return queryDict.hasOwnProperty( name ) ? decodeURIComponent( queryDict[ name ].replace( /\+/g, ' ' ) ) : '';
	}

	return queryDict;
};

/**
 * Get query parameter from the current URL.
 *
 * @param  {string} name      Query param to search for.
 * @param  {Object} _location Global `location` variable; used for DI-testing.
 * @return {string}           Value of the query param.
 */
export const getQueryParameter = ( name, _location = location ) => {
	const url = new URL( _location.href );
	if ( name ) {
		if ( ! url.searchParams || ! url.searchParams.get ) {
			return fallbackGetQueryParamater( name );
		}
		return url.searchParams.get( name );
	}
	const query = {};
	for ( const [ key, value ] of url.searchParams.entries() ) {
		query[ key ] = value;
	}
	return query;
};

/**
 * Send an analytics tracking event.
 *
 * @param {string} eventCategory The event category. Required.
 * @param {string} eventName The event category. Required.
 * @param {string} eventLabel The event category. Optional.
 * @param {string} eventValue The event category. Optional.
 *
 */
export const sendAnalyticsTrackingEvent = ( eventCategory, eventName, eventLabel = '', eventValue = '' ) => {
	if ( 'undefined' === typeof gtag || ! window.googlesitekitTrackingEnabled ) {
		return;
	}

	const {
		referenceSiteURL,
		userIDHash,
		trackingID,
		isFirstAdmin,
	} = window._googlesitekitBase;

	if ( ! trackingID ) {
		return;
	}

	const untrailingslashed = referenceSiteURL.substring( referenceSiteURL.length - 1 ) === '/' ? referenceSiteURL.substring( 0, referenceSiteURL.length - 1 ) : referenceSiteURL;

	return gtag( 'event', eventName, {
		send_to: trackingID, /*eslint camelcase: 0*/
		event_category: eventCategory, /*eslint camelcase: 0*/
		event_label: eventLabel, /*eslint camelcase: 0*/
		event_value: eventValue, /*eslint camelcase: 0*/
		dimension1: untrailingslashed, // Domain.
		dimension2: isFirstAdmin ? 'true' : 'false', // First Admin?
		dimension3: userIDHash, // Identifier.
	} );
};
