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
 * Internal dependencies
 */
import { STEP_STATUS } from './constants';
import Typography from '@/js/components/Typography';

export default function Step( { children, title, stepStatus } ) {
	return (
		<div className="googlesitekit-stepper__step-info">
			<Typography
				as="h2"
				className="googlesitekit-stepper__step-title"
				size="medium"
				type="title"
			>
				{ title }
			</Typography>
			<div className="googlesitekit-stepper__step-content-container">
				{ stepStatus === STEP_STATUS.ACTIVE && (
					<div className="googlesitekit-stepper__step-content">
						{ children }
					</div>
				) }
			</div>
		</div>
	);
}

Step.propTypes = {
	children: PropTypes.node.isRequired,
	title: PropTypes.string.isRequired,
	stepStatus: PropTypes.oneOf( Object.values( STEP_STATUS ) ),
};
