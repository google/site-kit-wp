/**
 * WizardStepCompleteSetup component.
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
import { sendAnalyticsTrackingEvent } from 'GoogleUtil';

/**
 * WordPress dependencies.
 */
const { __ } = wp.i18n;
const { Component } = wp.element;

class WizardStepCompleteSetup extends Component {
	constructor( props ) {
		super( props );
		const { hasSearchConsoleProperty } = googlesitekit.setup;

		// Search console property is set for all but the first user.
		if ( hasSearchConsoleProperty ) {
			sendAnalyticsTrackingEvent( 'plugin_setup', 'user_verified' );
		} else {
			sendAnalyticsTrackingEvent( 'plugin_setup', 'site_verified' );
		}
	}

	render() {
		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--five">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-phone
							mdc-layout-grid__cell--span-5-tablet
							mdc-layout-grid__cell--span-9-desktop
						">
							<h2 className="
									googlesitekit-heading-3
									googlesitekit-wizard-step__title
								">
								{ __( 'Congratulations!', 'google-site-kit' ) }
							</h2>
							<p>
								{ __( 'You successfully completed the Site Kit setup and connected Search Console. Check the dashboard for more services to connect.', 'google-site-kit' ) }
							</p>
							<div className="googlesitekit-wizard-step__action">
								<Button id="wizard-step-five-proceed" onClick={ this.props.completeSetup }>{ __( 'Go to Dashboard', 'google-site-kit' ) }</Button>
							</div>
						</div>
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-4-phone
							mdc-layout-grid__cell--span-3-tablet
							mdc-layout-grid__cell--span-3-desktop
						">
							<div className="googlesitekit-rocket">
								<img className="googlesitekit-rocket__body" alt="" src={ googlesitekit.admin.assetsRoot + 'images/rocket-body.png' } />
								<img className="googlesitekit-rocket__clouds" alt="" src={ googlesitekit.admin.assetsRoot + 'images/rocket-clouds.png' } />
								<img className="googlesitekit-rocket__dust" alt="" src={ googlesitekit.admin.assetsRoot + 'images/rocket-dust.png' } />
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
}

WizardStepCompleteSetup.propTypes = {
	completeSetup: PropTypes.func.isRequired,
};

export default WizardStepCompleteSetup;
