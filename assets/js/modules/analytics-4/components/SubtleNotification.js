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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import CheckFill from '../../../../svg/icons/check-fill.svg';
import { Grid, Cell, Row } from '../../../material-components';
import PropTypes from 'prop-types';

export default function SubtleNotification( {
	title,
	description,
	onDismiss,
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
					<Button tertiary onClick={ onDismiss }>
						{ __( 'Got it', 'google-site-kit' ) }
					</Button>
					{ additionalCTA }
				</Cell>
			</Row>
		</Grid>
	);
}

SubtleNotification.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	onDismiss: PropTypes.func.isRequired,
	additionalCTA: PropTypes.oneOfType( PropTypes.elementType, PropTypes.bool ),
};
