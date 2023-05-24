/**
 * Stepper component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { Children, cloneElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import Tick from '../../../svg/icons/tick.svg';
import { STEP_STATUS } from './constants';

// English-language labels for the step statuses.
const STEP_STATUS_LABEL = {
	[ STEP_STATUS.COMPLETED ]: 'completed',
	[ STEP_STATUS.ACTIVE ]: 'active',
	[ STEP_STATUS.UPCOMING ]: 'upcoming',
};

export default function Stepper( { children, activeStep } ) {
	function getStepStatus( index = -1 ) {
		if ( index < activeStep ) {
			return STEP_STATUS.COMPLETED;
		}

		if ( index === activeStep ) {
			return STEP_STATUS.ACTIVE;
		}

		return STEP_STATUS.UPCOMING;
	}

	const childCount = Children.count( children );

	return (
		<ol className="googlesitekit-stepper">
			{ Children.map( children, ( child, childIndex ) => {
				const stepStatus = getStepStatus( childIndex, activeStep );

				return (
					<li className="googlesitekit-stepper__step">
						<div className="googlesitekit-stepper__step-progress">
							<span
								className={ `googlesitekit-stepper__step-number googlesitekit-stepper__step-number--${ stepStatus }` }
								title={ sprintf(
									/* translators: 1: The number of the current step. 2: The total number of steps. 3: The status of the step ("completed", "active" or "upcoming"). */
									__(
										'Step %1$s of %2$s (%3$s).',
										'google-site-kit'
									),
									childIndex + 1,
									childCount,
									STEP_STATUS_LABEL[ stepStatus ]
								) }
							>
								{ stepStatus === STEP_STATUS.COMPLETED ? (
									<Tick />
								) : (
									childIndex + 1
								) }
							</span>
							{ childIndex < childCount - 1 && (
								<div className="googlesitekit-stepper__step-progress-line"></div>
							) }
						</div>
						{ cloneElement( child, { stepStatus } ) }
					</li>
				);
			} ) }
		</ol>
	);
}

Stepper.propTypes = {
	children: PropTypes.node.isRequired,
	// The index of the active step. If omitted or negative, all steps are in the upcoming state. If greater than the number of steps - 1, all steps are complete.
	activeStep: PropTypes.number,
};
