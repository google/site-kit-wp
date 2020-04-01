/**
 * Activation Main component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Button from '../button';
import Logo from '../logo';
import OptIn from '../optin';
import CompatibilityChecks from '../setup/compatibility-checks';

export function ActivationMain( { buttonURL, onButtonClick, buttonLabel } ) {
	return (
		<div className="mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-12
					">
					<Logo />

					<h3 className="googlesitekit-heading-3 googlesitekit-activation__title">
						{ __( 'Congratulations, the Site Kit plugin is now activated.', 'google-site-kit' ) }
					</h3>

					<CompatibilityChecks>
						{ ( { complete, inProgressFeedback, CTAFeedback } ) => (
							<Fragment>
								{ CTAFeedback }

								<OptIn optinAction="analytics_optin_setup_banner" />

								<div className="googlesitekit-start-setup-wrap">
									<Button
										id="start-setup-link"
										className="googlesitekit-start-setup"
										href={ buttonURL }
										onClick={ onButtonClick }
										disabled={ ! complete }
									>
										{ buttonLabel }
									</Button>
									{ inProgressFeedback }
								</div>
							</Fragment>
						) }
					</CompatibilityChecks>
				</div>
			</div>
		</div>
	);
}

ActivationMain.propTypes = {
	buttonURL: PropTypes.string.isRequired,
	onButtonClick: PropTypes.func,
	buttonLabel: PropTypes.string.isRequired,
};
