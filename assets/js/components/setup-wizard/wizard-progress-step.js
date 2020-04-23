/**
 * WizardProgressStep component.
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
import React from 'react';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SvgIcon from '../../util/svg-icon';

class WizardProgressStep extends Component {
	render() {
		const {
			currentStep,
			step,
			title,
			status,
			warning,
			error,
			stepKey,
		} = this.props;

		let statusClass = status;
		if ( warning ) {
			statusClass = 'warning';
		} else if ( error ) {
			statusClass = 'error';
		}

		/* @TODO We need to set these statuses dynamically. */
		let statusIcon = false;
		switch ( statusClass ) {
			case 'warning':
				statusIcon = <SvgIcon id="exclamation" height="12" width="2" />;
				break;
			case 'error':
				statusIcon = <SvgIcon id="exclamation" height="12" width="2" />;
				break;
			case 'completed':
				statusIcon = <SvgIcon id="check" height="12" width="16" />;
				break;
		}

		return (
			<div className={ classnames(
				'googlesitekit-wizard-progress-step',
				`googlesitekit-wizard-progress-step--${ step }`,
				`googlesitekit-wizard-progress-step--${ stepKey }`,
				{ 'googlesitekit-wizard-progress-step--current': currentStep }
			) }>
				<div className="googlesitekit-wizard-progress-step__number-wrapper">
					<div className={ classnames(
						'googlesitekit-wizard-progress-step__number',
						`googlesitekit-wizard-progress-step__number--${ statusClass }`
					) }>
						<span className={ classnames(
							'googlesitekit-wizard-progress-step__number-text',
							`googlesitekit-wizard-progress-step__number-text--${ statusClass }`
						) }>
							{ step }
						</span>
						{ statusIcon && (
							<span className={ classnames(
								'googlesitekit-wizard-progress-step__number-icon',
								`googlesitekit-wizard-progress-step__number-icon--${ statusClass }`
							) }>
								{ statusIcon }
							</span>
						) }
					</div>
				</div>
				<p className="googlesitekit-wizard-progress-step__text">
					{ title }
				</p>
			</div>
		);
	}
}

WizardProgressStep.propTypes = {
	currentStep: PropTypes.bool.isRequired,
	step: PropTypes.number.isRequired,
	title: PropTypes.string,
	status: PropTypes.string,
	warning: PropTypes.bool,
	error: PropTypes.bool,
};

WizardProgressStep.defaultProps = {
	title: '',
	status: '',
	warning: false,
	error: false,
	removeFirstStep: false,
};

export default WizardProgressStep;
