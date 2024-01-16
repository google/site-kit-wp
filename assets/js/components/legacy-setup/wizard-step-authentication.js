/**
 * WizardStepAuthentication component.
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
import OptIn from '../OptIn';

class WizardStepAuthentication extends Component {
	render() {
		const { connectURL, needReauthenticate, resetAndRestart } = this.props;

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--two">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<h2
								className="
								googlesitekit-heading-3
								googlesitekit-wizard-step__title
							"
							>
								{ __(
									'Authenticate with Google',
									'google-site-kit'
								) }
							</h2>
							<p>
								{ __(
									'Please sign into your Google account to begin.',
									'google-site-kit'
								) }
							</p>
							{ needReauthenticate && (
								<p className="googlesitekit-error-text">
									{ __(
										'You did not grant access to one or more of the requested scopes. Please grant all scopes that you are prompted for.',
										'google-site-kit'
									) }
								</p>
							) }
							<p>
								<Button
									onClick={ () => {
										document.location = connectURL;
									} }
								>
									{ __(
										'Sign in with Google',
										'google-site-kit'
									) }
								</Button>
								{ resetAndRestart && (
									<Button
										className="googlesitekit-wizard-step__back"
										tertiary
										onClick={ resetAndRestart }
									>
										{ __( 'Back', 'google-site-kit' ) }
									</Button>
								) }
							</p>
							<div className="googlesitekit-wizard-step__action googlesitekit-wizard-step__action--justify">
								<OptIn />
							</div>
						</Cell>
					</Row>
				</Grid>
			</section>
		);
	}
}

WizardStepAuthentication.propTypes = {
	connectURL: PropTypes.string.isRequired,
	resetAndRestart: PropTypes.func,
};

export default WizardStepAuthentication;
