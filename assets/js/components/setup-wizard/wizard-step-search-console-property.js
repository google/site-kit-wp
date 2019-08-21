/**
 * WizardStepSearchConsoleProperty component.
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
import SearchConsole from 'GoogleComponents/setup/search-console';

/**
 * WordPress dependencies.
 */
const { Component } = wp.element;

class WizardStepSearchConsoleProperty extends Component {
	render() {
		const { isVerified, hasSearchConsoleProperty } = this.props;
		const shouldSetup = isVerified && ! hasSearchConsoleProperty;

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--four">
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="
							mdc-layout-grid__cell
							mdc-layout-grid__cell--span-12
						">
							{
								shouldSetup ?
									<SearchConsole shouldSetup={ shouldSetup } { ...this.props } /> :
									SearchConsole.connected()
							}
						</div>
					</div>
				</div>
			</section>
		);
	}
}

WizardStepSearchConsoleProperty.propTypes = {
	searchConsoleSetup: PropTypes.func.isRequired,
};

export default WizardStepSearchConsoleProperty;
