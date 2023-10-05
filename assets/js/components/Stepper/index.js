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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children, cloneElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Tick from '../../../svg/icons/tick.svg';
import { STEP_STATUS } from './constants';

export default function Stepper( { children, activeStep, className } ) {
	const childCount = Children.count( children );

	function getStepStatus( index = -1 ) {
		if ( index < activeStep ) {
			return STEP_STATUS.COMPLETED;
		}

		if ( index === activeStep ) {
			return STEP_STATUS.ACTIVE;
		}

		return STEP_STATUS.UPCOMING;
	}

	function getNumberTitle( childNumber, stepStatus ) {
		switch ( stepStatus ) {
			case STEP_STATUS.UPCOMING:
				return sprintf(
					/* translators: 1: The number of the current step. 2: The total number of steps. */
					__( 'Step %1$s of %2$s (upcoming).', 'google-site-kit' ),
					childNumber,
					childCount
				);
			case STEP_STATUS.ACTIVE:
				return sprintf(
					/* translators: 1: The number of the current step. 2: The total number of steps. */
					__( 'Step %1$s of %2$s (active).', 'google-site-kit' ),
					childNumber,
					childCount
				);
			case STEP_STATUS.COMPLETED:
				return sprintf(
					/* translators: 1: The number of the current step. 2: The total number of steps. */
					__( 'Step %1$s of %2$s (completed).', 'google-site-kit' ),
					childNumber,
					childCount
				);
		}
	}

	return (
		<ol className={ classnames( 'googlesitekit-stepper', className ) }>
			{ Children.map( children, ( child, childIndex ) => {
				const stepStatus = getStepStatus( childIndex, activeStep );

				const childNumber = childIndex + 1;

				return (
					<li
						className={ classnames(
							'googlesitekit-stepper__step',
							child.props.className
						) }
					>
						<div className="googlesitekit-stepper__step-progress">
							<span
								className={ `googlesitekit-stepper__step-number googlesitekit-stepper__step-number--${ stepStatus }` }
								title={ getNumberTitle(
									childNumber,
									stepStatus
								) }
							>
								{ stepStatus === STEP_STATUS.COMPLETED ? (
									<Tick />
								) : (
									childNumber
								) }
							</span>
							{ childNumber < childCount && (
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
	// The zero-based index of the active step. If omitted or negative, all steps are in the upcoming state. If greater than the number of steps - 1, all steps are complete.
	activeStep: PropTypes.number,
	className: PropTypes.string,
};
