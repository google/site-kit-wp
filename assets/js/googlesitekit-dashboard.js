/**
 * Dashboard component.
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
 * External dependencies
 */
import { clearAppLocalStorage } from 'GoogleUtil';
import Setup from 'GoogleComponents/setup/setup-wrapper';
import DashboardApp from 'GoogleComponents/dashboard/dashboard-app';
import NotificationCounter from 'GoogleComponents/notifications/notification-counter';

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
import ErrorHandler from 'GoogleComponents/ErrorHandler';
import ErrorComponent from 'GoogleComponents/ErrorHandler/ErrorComponent';

class GoogleSitekitDashboard extends Component {
	constructor( props ) {
		super( props );

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );
	}

	// static getDerivedStateFromError() {
	// 	// eslint-disable-next-line no-console
	// 	console.log( 'getDerivedStateFromError', arguments );
	// 	// Update state so the next render will show the fallback UI.
	// 	// return {
	// 	// 	hasError: true,
	// 	// 	error,
	// 	// };
	// }

	render() {
		const {
			showModuleSetupWizard,
		} = window.googlesitekit.setup;

		if ( showModuleSetupWizard ) {
			return (
				<ErrorHandler>
					<Setup />
				</ErrorHandler>
			);
		}

		return (
			<ErrorHandler>
				<NotificationCounter />
				<DashboardApp />
				<ErrorComponent />
			</ErrorHandler>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( function() {
	if ( googlesitekit.admin.resetSession ) {
		clearAppLocalStorage();
	}

	const dashboard = document.getElementById( 'js-googlesitekit-dashboard' );
	if ( null !== dashboard ) {
		// Render the Dashboard App.
		render( <GoogleSitekitDashboard />, dashboard );

		/**
		 * Action triggered when the dashboard App is loaded.
		 */
		doAction( 'googlesitekit.moduleLoaded', 'Dashboard' );
	}
} );
