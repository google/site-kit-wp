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
import Layout from 'GoogleComponents/layout/layout';
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';
import { getSiteKitAdminURL } from 'SiteKitCore/util';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;
const { delay } = lodash;

class SetupUsingProxy extends Component {
	constructor( props ) {
		super( props );

		const { proxySetupURL } = googlesitekit.admin;
		const { isSiteKitConnected } = googlesitekit.setup;
		const { canSetup } = googlesitekit.permissions;

		this.state = {
			canSetup,
			isSiteKitConnected,
			completeSetup: false,
			proxySetupURL,
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

		const { proxySetupURL } = this.state;

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
														<h1 className="googlesitekit-setup__title">
															{ __( 'The Site Kit plugin is active but requires setup', 'google-site-kit' ) }
														</h1>
														<p className="googlesitekit-setup__description">
															{ __( 'Site Kit Service will guide you through 3 simple setup steps.', 'google-site-kit' ) }
														</p>
														<Button
															href={ proxySetupURL }
															onClick={ () => {
																sendAnalyticsTrackingEvent( 'plugin_setup', 'signin_with_google' );
															} }
														>
															{ __( 'Start setup', 'google-site-kit' ) }
														</Button>
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
