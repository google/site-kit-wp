/**
 * WizardStepSearchConsoleProperty component.
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
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Cell, Grid, Row } from '@/js/material-components';
import SearchConsole from './search-console';

class WizardStepSearchConsoleProperty extends Component {
	render() {
		const { isVerified, hasSearchConsoleProperty } = this.props;
		const shouldSetup = isVerified && ! hasSearchConsoleProperty;

		return (
			<section className="googlesitekit-wizard-step googlesitekit-wizard-step--four">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							{ shouldSetup ? (
								<SearchConsole
									shouldSetup={ shouldSetup }
									{ ...this.props }
								/>
							) : (
								SearchConsole.connected()
							) }
						</Cell>
					</Row>
				</Grid>
			</section>
		);
	}
}

WizardStepSearchConsoleProperty.propTypes = {
	searchConsoleSetup: PropTypes.func.isRequired,
};

export default WizardStepSearchConsoleProperty;
