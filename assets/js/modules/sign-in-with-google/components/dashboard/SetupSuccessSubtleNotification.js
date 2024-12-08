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
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

export default function SetupSuccessSubtleNotification( { id, Notification } ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'You successfully set up Sign in with Google!',
					'google-site-kit'
				) }
				description={ __(
					'Sign in with Google button was added to your site login page. You can customize the button appearance in settings.',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
						onDismiss={ onDismiss }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __(
							'Customize settings',
							'google-site-kit'
						) }
						ctaLink={ `${ settingsURL }#connected-services/sign-in-with-google/edit` }
					/>
				}
			/>
		</Notification>
	);
}
