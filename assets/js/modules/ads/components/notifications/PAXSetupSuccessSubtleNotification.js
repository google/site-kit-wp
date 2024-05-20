/**
 * PAXSetupSuccessSubtleNotification component.
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
import CheckFill from '../../../../../svg/icons/check-fill.svg';
import { Button } from 'googlesitekit-components';
import { Grid, Cell, Row } from '../../../../material-components';
import { getContextScrollTop } from '../../../../util/scroll';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from '../../datastore/constants';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';

export default function PAXSetupSuccessSubtleNotification() {
	const breakpoint = useBreakpoint();

	const [ notification, setNotification ] = useQueryArg( 'notification' );

	const onDismiss = () => {
		setNotification( undefined );
	};

	const scrollToWidget = ( event ) => {
		event.preventDefault();

		setTimeout( () => {
			const widgetClass = '.googlesitekit-widget--partnerAdsPAX';

			global.scrollTo( {
				top: getContextScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	if ( PAX_SETUP_SUCCESS_NOTIFICATION !== notification ) {
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
								'Your Ads campaign was successfully set up!',
								'google-site-kit'
							) }
						</p>
						<p className="googlesitekit-subtle-notification__secondary_description">
							{ __(
								'Track your conversions, measure your campaign results and make the most of your ad spend',
								'google-site-kit'
							) }
						</p>
					</div>
					<div className="googlesitekit-subtle-notification__action">
						<Button tertiary onClick={ onDismiss }>
							{ __( 'Got it', 'google-site-kit' ) }
						</Button>
						<Button
							onClick={ ( event ) => {
								scrollToWidget( event );
							} }
						>
							{ __( 'Show me', 'google-site-kit' ) }
						</Button>
					</div>
				</Cell>
			</Row>
		</Grid>
	);
}
