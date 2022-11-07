/**
 * WizardStepCompleteSetup component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Cell, Grid, Row } from '../../material-components';
import { trackEvent } from '../../util';

class WizardStepCompleteSetup extends Component {
	constructor( props ) {
		super( props );
		const { hasSearchConsoleProperty } =
			global._googlesitekitLegacyData.setup;

		// Search console property is set for all but the first user.
		if ( hasSearchConsoleProperty ) {
			trackEvent( 'plugin_setup', 'user_verified' );
		} else {
			trackEvent( 'plugin_setup', 'site_verified' );
		}
	}

	render() {
		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--five">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<h2
								className="
									googlesitekit-heading-3
									googlesitekit-wizard-step__title
								"
							>
								{ __( 'Congratulations!', 'google-site-kit' ) }
							</h2>
							<p>
								{ __(
									'You successfully completed the Site Kit setup and connected Search Console. Check the dashboard for more services to connect.',
									'google-site-kit'
								) }
							</p>
							<div className="googlesitekit-wizard-step__action">
								<Button
									id="wizard-step-five-proceed"
									onClick={ this.props.completeSetup }
								>
									{ __(
										'Go to Dashboard',
										'google-site-kit'
									) }
								</Button>
							</div>
						</Cell>
					</Row>
				</Grid>
			</section>
		);
	}
}

WizardStepCompleteSetup.propTypes = {
	completeSetup: PropTypes.func.isRequired,
};

export default WizardStepCompleteSetup;
