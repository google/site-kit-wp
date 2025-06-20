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
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import StarFill from '../../../../../svg/icons/star-fill.svg';
import { Grid, Cell, Row } from '../../../../material-components';

const SubtleNotification = forwardRef(
	(
		{
			className,
			title,
			description,
			dismissCTA,
			additionalCTA,
			reverseCTAs = false,
			type,
			icon,
		},
		ref
	) => {
		return (
			<Grid ref={ ref }>
				<Row>
					<Cell
						size={ 12 }
						className={ classnames(
							'googlesitekit-subtle-notification',
							className
						) }
						alignMiddle
					>
						<div className="googlesitekit-subtle-notification__icon">
							{ icon }
							{ type === 'new-feature' && ! icon && (
								<StarFill width={ 24 } height={ 24 } />
							) }
						</div>

						<div className="googlesitekit-subtle-notification__content">
							<p>{ title }</p>
							<p className="googlesitekit-subtle-notification__secondary_description">
								{ description }
							</p>
						</div>
						<div className="googlesitekit-subtle-notification__action">
							{ ! reverseCTAs && dismissCTA }
							{ reverseCTAs && additionalCTA }

							{ ! reverseCTAs && additionalCTA }
							{ reverseCTAs && dismissCTA }
						</div>
					</Cell>
				</Row>
			</Grid>
		);
	}
);

SubtleNotification.propTypes = {
	className: PropTypes.string,
	title: PropTypes.node,
	description: PropTypes.node,
	dismissCTA: PropTypes.node,
	additionalCTA: PropTypes.node,
	reverseCTAs: PropTypes.bool,
	type: PropTypes.oneOf( [ 'warning', 'new-feature' ] ),
	icon: PropTypes.object,
};

export default SubtleNotification;
