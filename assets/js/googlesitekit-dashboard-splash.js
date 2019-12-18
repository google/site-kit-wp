/**
 * DashboardSplash component.
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
import domReady from '@wordpress/dom-ready';
import { setLocaleData } from '@wordpress/i18n';
import { Component, render } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import ErrorHandler from 'GoogleComponents/ErrorHandler';
import { clearAppLocalStorage } from 'GoogleUtil';
import DashboardSplashApp from './components/dashboard-splash/dashboard-splash-app';
import NotificationCounter from './components/notifications/notification-counter';

class GoogleSitekitDashboardSplash extends Component {
	constructor( props ) {
		super( props );

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );
	}

	render() {
		return (
			<ErrorHandler>
				<NotificationCounter />
				<DashboardSplashApp />
			</ErrorHandler>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( function() {
	if ( googlesitekit.admin.resetSession ) {
		clearAppLocalStorage();
	}

	const dashboardSplash = document.getElementById( 'js-googlesitekit-dashboard-splash' );
	if ( null !== dashboardSplash ) {
		// Render the Dashboard Splash App.
		render( <GoogleSitekitDashboardSplash />, dashboardSplash );

		/**
		 * Action triggered when the Dashboard Splash App is loaded.
		 */
		doAction( 'googlesitekit.moduleLoaded', 'Splash' );
	}
} );
