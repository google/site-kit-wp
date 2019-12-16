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
import Notification from 'GoogleComponents/notifications/notification';
import Setup from 'GoogleComponents/setup/setup-wrapper';
import DashboardApp from 'GoogleComponents/dashboard/dashboard-app';
import NotificationCounter from 'GoogleComponents/notifications/notification-counter';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { setLocaleData } from '@wordpress/i18n';
import { Component, Fragment, render } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
// import ErrorHandler from 'GoogleComponents/ErrorHandler';
import ErrorComponent, { ThrowError } from 'GoogleComponents/ErrorHandler/ErrorComponent';

class GoogleSitekitDashboard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			hasError: false,
		};

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );
	}

	componentDidCatch() {
		// eslint-disable-next-line no-console
		console.log( 'componentDidCatch', arguments );
		// this.setState( {
		// 	hasError: true,
		// 	error,
		// 	info,
		// } );
	}

	static getDerivedStateFromError( error ) {
		// eslint-disable-next-line no-console
		console.log( 'getDerivedStateFromError', arguments );
		// Update state so the next render will show the fallback UI.
		return {
			hasError: true,
			error,
		};
	}

	render() {
		const {
			showModuleSetupWizard,
		} = window.googlesitekit.setup;

		const {
			hasError,
			error,
		} = this.state;

		if ( hasError ) {
			return <Notification
				id={ 'googlesitekit-error' }
				key={ 'googlesitekit-error' }
				title={ error.message }
				description={ error.stack }
				dismiss={ '' }
				isDismissable={ false }
				format="small"
				type="win-error"
			/>;
		}

		if ( showModuleSetupWizard ) {
			return (
				<Setup />
			);
		}

		return (
			<Fragment>
				<NotificationCounter />
				<DashboardApp />
				<ThrowError />
				<ErrorComponent />
			</Fragment>
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
