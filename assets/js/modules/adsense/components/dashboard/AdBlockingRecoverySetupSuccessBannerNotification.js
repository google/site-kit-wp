/**
 * AdBlockingRecoverySetupSuccessBannerNotification component.
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
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { DAY_IN_SECONDS } from '../../../../util';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';
import Link from '../../../../components/Link';

export const AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID =
	'ad-blocking-recovery-setup-success';

export default function AdBlockingRecoverySetupSuccessBannerNotification( {
	id,
	Notification,
} ) {
	const { triggerSurvey } = useDispatch( CORE_USER );

	const usingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);

	const adsenseAccountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);

	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ adsenseAccountID }/privacymessaging/ad_blocking`,
		} )
	);

	const handleView = useCallback( () => {
		if ( usingProxy ) {
			triggerSurvey( 'abr_setup_completed', { ttl: DAY_IN_SECONDS } );
		}
	}, [ triggerSurvey, usingProxy ] );

	return (
		<Notification onView={ handleView }>
			<SubtleNotification
				title={ __(
					'You successfully enabled the ad blocking recovery message',
					'google-site-kit'
				) }
				description={ createInterpolateElement(
					__(
						'Make sure to also create the message in <a>AdSense</a>, otherwise this feature won’t work',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={ privacyMessagingURL }
								external
								hideExternalIndicator
							/>
						),
					}
				) }
				dismissCTA={ <Dismiss id={ id } /> }
			/>
		</Notification>
	);
}
