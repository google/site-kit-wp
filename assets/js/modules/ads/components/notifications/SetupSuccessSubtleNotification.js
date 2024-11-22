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
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';
import useQueryArg from '../../../../hooks/useQueryArg';

export default function SetupSuccessSubtleNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Success! Your Conversion Tracking ID was added to your site',
					'google-site-kit'
				) }
				description={ __(
					'You can now track conversions for your Ads campaigns',
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
			/>
		</Notification>
	);
}
