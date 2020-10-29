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
import './modules';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { applyFilters } from '@wordpress/hooks';
import { Component, render, Suspense, lazy } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { loadTranslations } from './util';
import ProgressBar from './components/ProgressBar';
import './components/data';
import './components/notifications';
import Root from './components/root';
import ModuleApp from './components/module-app';

class GoogleSitekitModule extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			showModuleSetupWizard: global._googlesitekitLegacyData.setup.showModuleSetupWizard,
		};
	}

	render() {
		const {
			showModuleSetupWizard,
		} = this.state;

		const { moduleToSetup } = global._googlesitekitLegacyData.setup;
		const { currentAdminPage } = global._googlesitekitLegacyData.admin;

		/**
		 * Filters whether to show the Module setup wizard when showModuleSetupWizard is true.
		 *
		 * Modules can opt out of the wizard setup flow by returning false.
		 */
		const moduleHasSetupWizard = applyFilters( 'googlesitekit.moduleHasSetupWizard', true, currentAdminPage );

		if ( showModuleSetupWizard && moduleHasSetupWizard ) {
			// Set webpackPublicPath on-the-fly.
			if ( global._googlesitekitLegacyData && global._googlesitekitLegacyData.publicPath ) {
				// eslint-disable-next-line no-undef
				__webpack_public_path__ = global._googlesitekitLegacyData.publicPath; /*eslint camelcase: 0*/
			}

			const Setup = lazy( () => import( /* webpackChunkName: "chunk-googlesitekit-setup-wrapper" */'./components/setup/setup-wrapper' ) );

			return (
				<Suspense fallback={
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
				}>
					<Setup moduleSlug={ moduleToSetup } />
				</Suspense>
			);
		}

		return <ModuleApp />;
	}
}

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById( 'js-googlesitekit-module' );

	if ( renderTarget ) {
		loadTranslations();

		render(
			<Root dataAPIContext="Single" dataAPIModuleArgs={ global.googlesitekitCurrentModule } >
				<GoogleSitekitModule />
			</Root>,
			renderTarget
		);
	}
} );
