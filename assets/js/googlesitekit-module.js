/**
 * Module component.
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
import ProgressBar from 'GoogleComponents/progress-bar';
import 'GoogleComponents/data';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { setLocaleData } from '@wordpress/i18n';
import { doAction, applyFilters } from '@wordpress/hooks';
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ErrorHandler from 'GoogleComponents/ErrorHandler';
import { Suspense, lazy } from 'GoogleUtil/react-features';
import ModuleApp from './components/module-app';

class GoogleSitekitModule extends Component {
	constructor( props ) {
		super( props );

		// Set up translations.
		setLocaleData( googlesitekit.locale, 'google-site-kit' );

		const {
			showModuleSetupWizard,
		} = googlesitekit.setup;

		this.state = {
			showModuleSetupWizard,
		};
	}

	render() {
		const {
			showModuleSetupWizard,
		} = this.state;

		const { currentAdminPage } = googlesitekit.admin;

		/**
		 * Filters whether to show the Module setup wizard when showModuleSetupWizard is true.
		 *
		 * Modules can opt out of the wizard setup flow by returning false.
		 */
		const moduleHasSetupWizard = applyFilters( 'googlesitekit.moduleHasSetupWizard', true, currentAdminPage );

		if ( showModuleSetupWizard && moduleHasSetupWizard ) {
			// Set webpackPublicPath on-the-fly.
			if ( window.googlesitekit && window.googlesitekit.publicPath ) {
				// eslint-disable-next-line no-undef
				__webpack_public_path__ = window.googlesitekit.publicPath; /*eslint camelcase: 0*/
			}

			const Setup = lazy( () => import( /* webpackChunkName: "chunk-googlesitekit-setup-wrapper" */'./components/setup/setup-wrapper' ) );

			return (

				<Suspense fallback={
					<ErrorHandler>
						<div className="googlesitekit-setup">
							<div className="mdc-layout-grid">
								<div className="mdc-layout-grid__inner">
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-12
									">
										<div className="googlesitekit-setup__wrapper">
											<div className="mdc-layout-grid">
												<div className="mdc-layout-grid__inner">
													<div className="
														mdc-layout-grid__cell
														mdc-layout-grid__cell--span-12
													">
														<ProgressBar />
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</ErrorHandler>
				}>
					<ErrorHandler>
						<Setup />
					</ErrorHandler>
				</Suspense>
			);
		}

		return (
			<ErrorHandler>
				<ModuleApp />
			</ErrorHandler>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( function() {
	const siteKitModule = document.getElementById( 'js-googlesitekit-module' );
	if ( null !== siteKitModule ) {
		// Render the Dashboard App.
		render( <GoogleSitekitModule />, siteKitModule );

		/**
		 * Action triggered when the dashboard App is loaded.
		 */
		doAction( 'googlesitekit.moduleLoaded', 'Single', googlesitekitCurrentModule );
	}
} );

