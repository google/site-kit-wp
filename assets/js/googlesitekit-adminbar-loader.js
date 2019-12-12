/**
 * Admin bar loader.
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

/* eslint camelcase:[0] */

/**
 * External dependencies
 */
import {
	appendNotificationsCount,
	sendAnalyticsTrackingEvent,
	getQueryParameter,
} from 'GoogleUtil';

// Set webpackPublicPath on-the-fly.
if ( window.googlesitekitAdminbar && window.googlesitekitAdminbar.publicPath ) {
	// eslint-disable-next-line no-undef
	__webpack_public_path__ = window.googlesitekitAdminbar.publicPath;
}

// Is adminbar scripts loaded?
let isAdminbarLoaded = false;

// Load adminbar script dynamically.
function loadAdminbarScripts() {
	return import(

		/* webpackChunkName: "chunk-googlesitekit-adminbar" */
		'./googlesitekit-adminbar'
	).then( ( GoogleSitekitAdminbar ) => {
		return GoogleSitekitAdminbar;
	} ).catch( () => {
		return new Error( 'Site Kit: An error occurred while loading the Adminbar component files.' );
	} );
}

function initAdminbar() {
	loadAdminbarScripts().then( ( GoogleSitekitAdminbar ) => {
		try {
			// Initialize the adminbar.
			GoogleSitekitAdminbar.init();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Site Kit: An error occurred while loading the Adminbar components.' );

			// Set adminbar to error-state.
			document.getElementById( 'js-googlesitekit-adminbar' ).classList.add( 'googlesitekit-adminbar--has-error' );
		}

		// Remove the loading state.
		document.getElementById( 'js-googlesitekit-adminbar' ).classList.remove( 'googlesitekit-adminbar--loading' );
	} );
}

// Initialize the loader once the DOM is ready.
window.addEventListener( 'load', function() {
	// Add event to Site Kit adminbar icon.
	const adminbarIconTrigger = document.getElementById( 'wp-admin-bar-google-site-kit' );
	let loadingGtag = false;

	// Check if adminbarIconTrigger is an element.
	if ( ! adminbarIconTrigger ) {
		return;
	}

	// The total notifications count should always rely on local storage
	// directly for external availability.
	if ( ! window.localStorage ) {
		return;
	}

	const count = window.localStorage.getItem( 'googlesitekit::total-notifications' ) || 0;
	appendNotificationsCount( count );

	const onViewAdminBarMenu = function() {
		if ( isAdminbarLoaded ) {
			return;
		}

		// Track the menu hover event.
		if ( window.googlesitekitTrackingEnabled ) {
			// Dynamically load the gtag script if not loaded.
			if ( 'undefined' === typeof gtag && ! loadingGtag ) {
				loadingGtag = true;
				const gtagScript = document.createElement( 'script' );
				gtagScript.type = 'text/javascript';
				gtagScript.setAttribute( 'async', 'true' );
				gtagScript.onload = function() {
					window.gtag = function() {
						window.dataLayer.push( arguments );
					};
					sendAnalyticsTrackingEvent( 'admin_bar', 'page_stats_view' );
				};
				gtagScript.setAttribute( 'src', `https://www.googletagmanager.com/gtag/js?id=${ googlesitekit.admin.trackingID }` );
				document.head.appendChild( gtagScript );
			} else {
				sendAnalyticsTrackingEvent( 'admin_bar', 'page_stats_view' );
			}
		}

		initAdminbar();
		isAdminbarLoaded = true;
	};

	if ( 'true' === getQueryParameter( 'googlesitekit_adminbar_open' ) ) {
		onViewAdminBarMenu();
		adminbarIconTrigger.classList.add( 'hover' );
	} else {
		adminbarIconTrigger.addEventListener( 'mouseenter', onViewAdminBarMenu, false );
	}
} );

