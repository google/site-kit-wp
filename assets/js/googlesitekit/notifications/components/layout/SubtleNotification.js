/**
 * SubtleNotification component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import CheckFill from '../../../../../svg/icons/check-fill.svg';
import { Grid, Cell, Row } from '../../../../material-components';

export default function SubtleNotification( {
	title,
	description,
	dismissCTA,
	additionalCTA = false,
} ) {
	return (
		<Grid>
			<Row>
				<Cell
					alignMiddle
					size={ 12 }
					className="googlesitekit-subtle-notification"
				>
					<div className="googlesitekit-subtle-notification__icon">
						<CheckFill width={ 24 } height={ 24 } />
					</div>
					<div className="googlesitekit-subtle-notification__content">
						<p>{ title }</p>
						<p className="googlesitekit-subtle-notification__secondary_description">
							{ description }
						</p>
					</div>
					{ dismissCTA }
					{ !! additionalCTA && additionalCTA }
				</Cell>
			</Row>
		</Grid>
	);
}

SubtleNotification.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.node,
	dismissCTA: PropTypes.node,
	additionalCTA: PropTypes.oneOfType( [ PropTypes.node, PropTypes.bool ] ),
};
