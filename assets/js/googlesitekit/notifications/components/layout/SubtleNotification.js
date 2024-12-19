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
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import CheckFill from '../../../../../svg/icons/check-fill.svg';
import WarningSVG from '../../../../../svg/icons/warning.svg';
import { Grid, Cell, Row } from '../../../../material-components';

export default function SubtleNotification( {
	className,
	title,
	description,
	dismissCTA,
	additionalCTA,
	type = 'success',
	icon,
} ) {
	return (
		<Grid>
			<Row>
				<Cell
					alignMiddle
					size={ 12 }
					className={ classnames(
						'googlesitekit-subtle-notification',
						className,
						{
							'googlesitekit-subtle-notification--success':
								type === 'success',
							'googlesitekit-subtle-notification--warning':
								type === 'warning',
						}
					) }
				>
					<div className="googlesitekit-subtle-notification__icon">
						{ icon }
						{ type === 'success' && ! icon && (
							<CheckFill width={ 24 } height={ 24 } />
						) }
						{ type === 'warning' && ! icon && (
							<WarningSVG width={ 24 } height={ 24 } />
						) }
					</div>

					<div className="googlesitekit-subtle-notification__content">
						<p>{ title }</p>
						<p className="googlesitekit-subtle-notification__secondary_description">
							{ description }
						</p>
					</div>
					<div className="googlesitekit-subtle-notification__action">
						{ dismissCTA }

						{ additionalCTA }
					</div>
				</Cell>
			</Row>
		</Grid>
	);
}

SubtleNotification.propTypes = {
	className: PropTypes.string,
	title: PropTypes.node.isRequired,
	description: PropTypes.node,
	dismissCTA: PropTypes.node,
	additionalCTA: PropTypes.node,
	type: PropTypes.string,
	icon: PropTypes.object,
};
