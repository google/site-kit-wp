/**
 * WizardStepVerification component.
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
import SiteVerification from 'GoogleComponents/setup/site-verification';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class WizardStepVerification extends Component {
	render() {
		const { isVerified } = this.props;
		const shouldSetup = ! isVerified;

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--three">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							<SiteVerification shouldSetup={ shouldSetup } { ...this.props } />
						</div>
					</div>
				</div>
			</section>
		);
	}
}

WizardStepVerification.propTypes = {
	siteVerificationSetup: PropTypes.func.isRequired,
};

export default WizardStepVerification;
