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
import { Button } from 'googlesitekit-components';
import { getContextScrollTop } from '../../../../util/scroll';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';

export default function PAXSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();

	const [ , setNotification ] = useQueryArg( 'notification' );

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

			setNotification( undefined );
		}, 50 );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Your Ads campaign was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Track your conversions, measure your campaign results and make the most of your ad spend',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
						onDismiss={ onDismiss }
					/>
				}
				additionalCTA={
					<Button onClick={ scrollToWidget }>
						{ __( 'Show me', 'google-site-kit' ) }
					</Button>
				}
			/>
		</Notification>
	);
}
