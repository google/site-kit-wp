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
import { clearWebStorage, loadTranslations } from 'GoogleUtil';
import Notification from 'GoogleComponents/notifications/notification';
import Setup from 'GoogleComponents/setup/setup-wrapper';
import DashboardApp from 'GoogleComponents/dashboard/dashboard-app';
import NotificationCounter from 'GoogleComponents/notifications/notification-counter';
import 'GoogleComponents/notifications';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { Component, render, Fragment } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';

class GoogleSitekitDashboard extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			hasError: false,
		};
	}

	componentDidCatch( error, info ) {
		this.setState( {
			hasError: true,
			error,
			info,
		} );
	}

	render() {
		const {
			showModuleSetupWizard,
		} = window.googlesitekit.setup;

		if ( showModuleSetupWizard ) {
			return (
				<Setup />
			);
		}

		const {
			hasError,
			error,
			info,
		} = this.state;

		if ( hasError ) {
			return <Notification
				id={ 'googlesitekit-error' }
				key={ 'googlesitekit-error' }
				title={ error }
				description={ info.componentStack }
				dismiss={ '' }
				isDismissable={ false }
				format="small"
				type="win-error"
			/>;
		}

		return (
			<Fragment>
				<NotificationCounter />
				<DashboardApp />
			</Fragment>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( () => {
	if ( googlesitekit.admin.resetSession ) {
		clearWebStorage();
	}

	const renderTarget = document.getElementById( 'js-googlesitekit-dashboard' );

	if ( renderTarget ) {
		loadTranslations();

		render( <GoogleSitekitDashboard />, renderTarget );

		/**
		 * Action triggered when the dashboard App is loaded.
		 */
		doAction( 'googlesitekit.moduleLoaded', 'Dashboard' );
	}
} );
