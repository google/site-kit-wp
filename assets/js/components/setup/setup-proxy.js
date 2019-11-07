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
import Optin from 'GoogleComponents/optin';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';
import { getSiteKitAdminURL } from 'SiteKitCore/util';
import { delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

class SetupUsingProxy extends Component {
	constructor( props ) {
		super( props );

		const { proxySetupURL, siteURL } = googlesitekit.admin;
		const { isSiteKitConnected } = googlesitekit.setup;
		const { canSetup } = googlesitekit.permissions;

		this.state = {
			canSetup,
			isSiteKitConnected,
			completeSetup: false,
			proxySetupURL,
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
				window.location.replace( redirectURL );
			}, 500, 'later' );
		}

		const { context, proxySetupURL, siteHostname } = this.state;
		const isRevoked = 'revoked' === context;

		return (
			<Fragment>
				<Header />
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
														{ isRevoked ? (
															<Fragment>
																<h1 className="googlesitekit-setup__title">
																	{ sprintf(
																		/* translators: %s is the site's hostname. (e.g. example.com) */
																		__( 'You revoked access to Site Kit for %s', 'google-site-kit' ),
																		siteHostname
																	) }
																</h1>
																<p className="googlesitekit-setup__description">
																	{ __( 'Site Kit will no longer have access to your account. If you’d like to reconnect Site Kit, click "Start Setup" below to generate new credentials.', 'google-site-kit' ) }
																</p>
															</Fragment>
														) : (
															<Fragment>
																<h1 className="googlesitekit-setup__title">
																	{ __( 'The Site Kit plugin is active but requires setup', 'google-site-kit' ) }
																</h1>
																<p className="googlesitekit-setup__description">
																	{ __( 'Site Kit Service will guide you through 3 simple setup steps.', 'google-site-kit' ) }
																</p>
															</Fragment>
														) }
														<Button
															className="googlesitekit-start-setup"
															href={ proxySetupURL }
															onClick={ () => {
																sendAnalyticsTrackingEvent( 'plugin_setup', 'proxy_start_setup_landing_page' );
															} }
														>
															{ __( 'Start setup', 'google-site-kit' ) }
														</Button>
														<ResetButton />
														<Optin />
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
