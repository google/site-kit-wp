/**
 * Step component.
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
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { STEP_STATUS } from './constants';

export default function Step( { children, title, stepStatus } ) {
	const stepContentRef = useRef();

	useEffect( () => {
		if ( ! stepContentRef.current ) {
			return;
		}

		if ( stepStatus === STEP_STATUS.ACTIVE ) {
			stepContentRef.current.style.height = `${ stepContentRef.current.scrollHeight }px`;
		} else {
			stepContentRef.current.style.height = '0px';
		}
	}, [ stepStatus ] );

	return (
		<div>
			<h2
				className={ `googlesitekit-stepper__step-title googlesitekit-stepper__step-title--${ stepStatus }` }
			>
				{ title }
			</h2>
			<div
				ref={ stepContentRef }
				className={ `googlesitekit-stepper__step-content googlesitekit-stepper__step-content--${ stepStatus }` }
			>
				{ children }
			</div>
		</div>
	);
}

Step.propTypes = {
	children: PropTypes.node.isRequired,
	title: PropTypes.string.isRequired,
	stepStatus: PropTypes.oneOf( Object.values( STEP_STATUS ) ),
};
