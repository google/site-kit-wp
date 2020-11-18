/**
 * LegacyDashboardSplashApp component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LegacyDashboardSplashMain from './LegacyDashboardSplashMain';
import LegacyDashboardSplashNotifications from './LegacyDashboardSplashNotifications';
import { trackEvent } from '../../util';
import SetupUsingGCP from '../setup';
import SetupWrapper from '../setup/setup-wrapper';

const AUTHENTICATION = 1;
const SETUP = 2;

class LegacyDashboardSplashApp extends Component {
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

		if ( ! this.state.showAuthenticationSetupWizard && ! this.state.showModuleSetupWizard ) {
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
					<LegacyDashboardSplashNotifications />
					<LegacyDashboardSplashMain
						introDescription={ introDescription }
						outroDescription={ outroDescription }
						buttonLabel={ buttonLabel }
						onButtonClick={ onButtonClick }
					/>
				</Fragment>
			);
		}

		if ( this.state.showAuthenticationSetupWizard ) {
			return <SetupUsingGCP />;
		}

		return <SetupWrapper moduleSlug={ moduleToSetup } />;
	}
}

export default LegacyDashboardSplashApp;
