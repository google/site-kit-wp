/**
 * WPDashboard component.
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
import { doAction } from '@wordpress/hooks';
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
// Load the data module.
// eslint-disable-next-line @wordpress/dependency-group
import 'GoogleComponents/data';
import ErrorHandler from 'GoogleComponents/ErrorHandler';
import WPDashboardMain from './components/wp-dashboard/wp-dashboard-main';

class GoogleSitekitWPDashboard extends Component {
	constructor( props ) {
		super( props );

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );
	}

	render() {
		return (
			<ErrorHandler>
				<WPDashboardMain />
			</ErrorHandler>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( function() {
	const wpDashboard = document.getElementById( 'js-googlesitekit-wp-dashboard' );
	if ( null !== wpDashboard ) {
		// Render the Dashboard App.
		render( <GoogleSitekitWPDashboard />, wpDashboard );

		/**
		 * Action triggered when the WP Dashboard App is loaded.
	 	*/
		doAction( 'googlesitekit.moduleLoaded', 'WPDashboard' );
	}
} );
