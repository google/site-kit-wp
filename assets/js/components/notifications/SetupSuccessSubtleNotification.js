/**
 * SetupSuccessSubtleNotification component.
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
import CheckFill from '../../../svg/icons/check-fill.svg';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../material-components';
import useQueryArg from '../../hooks/useQueryArg';

export default function SetupSuccessSubtleNotification() {
	const [ notification, setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	// The Ads module setup flow is the only module setup flow that uses this new style subtle
	// notification, all others use the BannerNotification still.
	if ( 'authentication_success' !== notification || slug !== 'ads' ) {
		return null;
	}

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
						<p>
							{ __(
								'Success! Your Ads conversion ID was added to your site',
								'google-site-kit'
							) }
						</p>
						<p className="googlesitekit-subtle-notification__secondary_description">
							{ __(
								'You can now track conversions for your Ads campaigns.',
								'google-site-kit'
							) }
						</p>
					</div>
					<Button tertiary onClick={ onDismiss }>
						{ __( 'Got it', 'google-site-kit' ) }
					</Button>
				</Cell>
			</Row>
		</Grid>
	);
}
