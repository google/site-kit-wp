/**
 * Setup component.
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
import Header from 'GoogleComponents/header';
import Button from 'GoogleComponents/button';
import ResetButton from 'GoogleComponents/reset-button';
import Layout from 'GoogleComponents/layout/layout';
import Notification from 'GoogleComponents/notifications/notification';
import OptIn from 'GoogleComponents/optin';
import { trackEvent } from 'GoogleUtil';
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getSiteKitAdminURL } from '../../util';
import CompatibilityChecks from './compatibility-checks';

class SetupUsingProxy extends Component {
	constructor( props ) {
		super( props );

		const { proxySetupURL, siteURL } = global.googlesitekit.admin;
		const { isSiteKitConnected, isResettable, errorMessage } = global.googlesitekit.setup;
		const { canSetup } = global.googlesitekit.permissions;

		this.state = {
			canSetup,
			errorMessage,
			isSiteKitConnected,
			isResettable,
			completeSetup: false,
			proxySetupURL,
			resetSuccess: getQueryArg( location.href, 'notification' ) === 'reset_success',
			context: getQueryArg( location.href, 'googlesitekit_context' ),
			siteHostname: ( new URL( siteURL ) ).hostname,
		};
	}

	isSetupFinished() {
		const {
			isSiteKitConnected,
			completeSetup,
		} = this.state;

		return isSiteKitConnected && completeSetup;
	}

	render() {
		if ( this.isSetupFinished() ) {
			const redirectURL = getSiteKitAdminURL(
				'googlesitekit-dashboard',
				{
					notification: 'authentication_success',
				},
			);

			delay( () => {
				global.location.replace( redirectURL );
			}, 500, 'later' );
		}

		const {
			context,
			errorMessage,
			isResettable,
			proxySetupURL,
			resetSuccess,
			siteHostname,
		} = this.state;
		const isRevoked = 'revoked' === context;
		const isSecondAdmin = isResettable;

		let title;
		let description;
		let startSetupText;

		if ( isRevoked ) {
			title = sprintf(
				/* translators: %s is the site's hostname. (e.g. example.com) */
				__( 'You revoked access to Site Kit for %s', 'google-site-kit' ),
				siteHostname
			);
			description = __( 'Site Kit will no longer have access to your account. If you’d like to reconnect Site Kit, click "Start Setup" below to generate new credentials.', 'google-site-kit' );
			startSetupText = __( 'Sign in with Google', 'google-site-kit' );
		} else if ( isSecondAdmin ) {
			title = __( 'Sign in with Google to configure Site Kit', 'google-site-kit' );
			description = __( 'To use Site Kit, sign in with your Google account. The Site Kit service will guide you through 3 simple steps to complete the connection and configure the plugin.', 'google-site-kit' );
			startSetupText = __( 'Sign in with Google', 'google-site-kit' );
		} else {
			title = __( 'Sign in with Google to set up Site Kit', 'google-site-kit' );
			description = __( 'The Site Kit service will guide you through 3 simple setup steps.', 'google-site-kit' );
			startSetupText = __( 'Start setup', 'google-site-kit' );
		}

		return (
			<Fragment>
				<Header />
				{ errorMessage && (
					<Notification
						id="setup_error"
						type="win-error"
						title={ __( 'Oops! There was a problem during set up. Please try again.', 'google-site-kit' ) }
						description={ errorMessage }
						isDismissable={ false }
					/>
				) }
				{ resetSuccess && (
					<Notification
						id="reset_success"
						title={ __( 'Site Kit by Google was successfully reset.', 'google-site-kit' ) }
						isDismissable={ false }
					/>
				) }
				<div className="googlesitekit-wizard">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<Layout>
									<section className="googlesitekit-wizard-progress">
										<div className="googlesitekit-setup__footer">
											<div className="mdc-layout-grid">
												<div className="mdc-layout-grid__inner">
													<div className="
														mdc-layout-grid__cell
														mdc-layout-grid__cell--span-12
													">
														<h1 className="googlesitekit-setup__title">
															{ title }
														</h1>
														<p className="googlesitekit-setup__description">
															{ description }
														</p>

														<CompatibilityChecks>
															{ ( { complete, inProgressFeedback, CTAFeedback } ) => (
																<Fragment>
																	{ CTAFeedback }

																	<OptIn optinAction="analytics_optin_setup_fallback" />

																	<div className="googlesitekit-start-setup-wrap">
																		<Button
																			className="googlesitekit-start-setup"
																			href={ proxySetupURL }
																			onClick={ () => {
																				trackEvent( 'plugin_setup', 'proxy_start_setup_landing_page' );
																			} }
																			disabled={ ! complete }
																		>
																			{ startSetupText }
																		</Button>
																		{ inProgressFeedback }
																		{ isResettable && <ResetButton /> }
																	</div>
																</Fragment>
															) }
														</CompatibilityChecks>
													</div>
												</div>
											</div>
										</div>
									</section>
								</Layout>
							</div>
						</div>
					</div>
				</div>
			</Fragment>
		);
	}
}

export default SetupUsingProxy;
