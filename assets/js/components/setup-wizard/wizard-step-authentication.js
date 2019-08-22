/**
 * WizardStepAuthentication component.
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
import PropTypes from 'prop-types';
import Button from 'GoogleComponents/button';
import Link from 'GoogleComponents/link';
import {
	sendAnalyticsTrackingEvent,
} from 'GoogleUtil';
import Optin from 'GoogleComponents/optin';
import HelpLink from 'GoogleComponents/help-link';

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class WizardStepAuthentication extends Component {
	render() {
		const {
			connectURL,
			needReauthenticate,
			resetAndRestart,
		} = this.props;

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--two">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<h2 className="
								googlesitekit-heading-3
								googlesitekit-wizard-step__title
							">
								{ __( 'Authenticate with Google', 'google-site-kit' ) }
							</h2>
							<p>
								{ __( 'Please sign into your Google account to begin.', 'google-site-kit' ) }
							</p>
							{
								needReauthenticate &&
								<p className="googlesitekit-error-text">
									{ __( 'You did not grant access to one or more of the requested scopes. Please grant all scopes that you are prompted for.', 'google-site-kit' ) }
								</p>
							}
							<p>
								<Button
									onClick={ () => {
										sendAnalyticsTrackingEvent( 'plugin_setup', 'signin_with_google' );
										document.location = connectURL;
									} }
								>
									{ __( 'Sign in with Google', 'google-site-kit' ) }
								</Button>
								{ resetAndRestart &&
									<Link
										className="googlesitekit-wizard-step__back"
										onClick={ resetAndRestart }
									>
										{ __( 'Back', 'google-site-kit' ) }
									</Link>
								}
							</p>
							<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
								<Optin />
								<HelpLink />
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
}

WizardStepAuthentication.propTypes = {
	connectURL: PropTypes.string.isRequired,
	resetAndRestart: PropTypes.func,
};

export default WizardStepAuthentication;
