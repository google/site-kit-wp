/**
 * DashboardSplashApp component.
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
import { Component, Fragment, Suspense, lazy } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DashboardSplashMain from './dashboard-splash-main';
import DashboardSplashNotifications from './dashboard-splash-notifications';
import ProgressBar from '../progress-bar';
import { trackEvent } from '../../util';
import '../publisher-wins';

const AUTHENTICATION = 1;
const SETUP = 2;

class DashboardSplashApp extends Component {
	constructor( props ) {
		super( props );

		const { connectURL } = global._googlesitekitLegacyData.admin;

		const {
			showModuleSetupWizard,
			isAuthenticated,
			isVerified,
			hasSearchConsoleProperty,
		} = global._googlesitekitLegacyData.setup;

		const {
			canAuthenticate,
			canSetup,
			canViewDashboard,
			canPublishPosts,
		} = global._googlesitekitLegacyData.permissions;

		this.state = {
			showAuthenticationSetupWizard: canSetup && ( ! isAuthenticated || ! isVerified || ! hasSearchConsoleProperty ),
			showModuleSetupWizard,
			canViewDashboard,
			canPublishPosts,
			buttonMode: 0,
			connectURL,
		};

		if ( canAuthenticate && ! isAuthenticated ) {
			this.state.buttonMode = AUTHENTICATION;
		}
		if ( canSetup && ( ! isAuthenticated || ! isVerified || ! hasSearchConsoleProperty ) ) {
			this.state.buttonMode = SETUP;
		}

		this.openAuthenticationSetupWizard = this.openAuthenticationSetupWizard.bind( this );
		this.gotoConnectURL = this.gotoConnectURL.bind( this );
	}

	async openAuthenticationSetupWizard() {
		await trackEvent( 'plugin_setup', 'setup_sitekit' );

		this.setState( {
			showAuthenticationSetupWizard: true,
		} );
	}

	async gotoConnectURL() {
		this.setState( {
			showAuthenticationInstructionsWizard: false,
			showAuthenticationSetupWizard: false,
		} );

		await trackEvent( 'plugin_setup', 'connect_account' );

		document.location = this.state.connectURL;
	}

	render() {
		const { moduleToSetup } = global._googlesitekitLegacyData.setup;

		// Set webpackPublicPath on-the-fly.
		if ( global._googlesitekitLegacyData && global._googlesitekitLegacyData.publicPath ) {
			// eslint-disable-next-line no-undef, camelcase
			__webpack_public_path__ = global._googlesitekitLegacyData.publicPath;
		}

		const { usingProxy } = global._googlesitekitBaseData;

		// If `usingProxy` is true it means the proxy is in use. We should never
		// show the GCP splash screen when the proxy is being used, so skip this
		// when `usingProxy` is set.
		// See: https://github.com/google/site-kit-wp/issues/704.
		if ( ! usingProxy && ! this.state.showAuthenticationSetupWizard && ! this.state.showModuleSetupWizard ) {
			let introDescription, outroDescription, buttonLabel, onButtonClick;

			switch ( this.state.buttonMode ) {
				case AUTHENTICATION:
					introDescription = __( 'You’re one step closer to connecting Google services to your WordPress site.', 'google-site-kit' );
					outroDescription = __( 'Connecting your account only takes a few minutes. Faster than brewing a cup of coffee.', 'google-site-kit' );
					buttonLabel = __( 'Connect your account', 'google-site-kit' );
					onButtonClick = this.gotoConnectURL;
					break;
				case SETUP:
					introDescription = __( 'You’re one step closer to connecting Google services to your WordPress site.', 'google-site-kit' );
					outroDescription = __( 'Setup only takes a few minutes. Faster than brewing a cup of coffee.', 'google-site-kit' );
					buttonLabel = __( 'Set Up Site Kit', 'google-site-kit' );
					onButtonClick = this.openAuthenticationSetupWizard;
					break;
				default:
					if ( this.state.canViewDashboard ) {
						introDescription = __( 'Start gaining insights on how your site is performing in search by visiting the dashboard.', 'google-site-kit' );
					} else if ( this.state.canPublishPosts ) {
						introDescription = __( 'Start gaining insights on how your site is performing in search by editing one of your posts.', 'google-site-kit' );
					} else {
						introDescription = __( 'Start gaining insights on how your site is performing in search by viewing one of your published posts.', 'google-site-kit' );
					}
			}

			return (
				<Fragment>
					<DashboardSplashNotifications />
					<DashboardSplashMain introDescription={ introDescription } outroDescription={ outroDescription } buttonLabel={ buttonLabel } onButtonClick={ onButtonClick } />
				</Fragment>
			);
		}

		let Setup = null;

		// `usingProxy` is only set if the proxy is in use.
		if ( usingProxy ) {
			Setup = lazy( () => import( /* webpackChunkName: "chunk-googlesitekit-setup-wizard-proxy" */'../setup/setup-proxy' ) );
		} else if ( this.state.showAuthenticationSetupWizard ) {
			Setup = lazy( () => import( /* webpackChunkName: "chunk-googlesitekit-setup-wizard" */'../setup' ) );
		} else {
			Setup = lazy( () => import( /* webpackChunkName: "chunk-googlesitekit-setup-wrapper" */'../setup/setup-wrapper' ) );
		}

		return (
			<Suspense fallback={
				<Fragment>
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
				</Fragment>
			}>
				<Setup moduleSlug={ moduleToSetup } />
			</Suspense>
		);
	}
}

export default DashboardSplashApp;
