/**
 * AdBlockingRecoverySetupSuccessNotification component.
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
import NoticeNotification from '../../../../googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '../../../../components/Notice/constants';
import Link from '../../../../components/Link';
import useQueryArg from '../../../../hooks/useQueryArg';

export default function AdBlockingRecoverySetupSuccessNotification( {
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

	const [ , setNotification ] = useQueryArg( 'notification' );

	const dismissNotice = useCallback( () => {
		setNotification( undefined );
	}, [ setNotification ] );

	return (
		<Notification onView={ handleView }>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.SUCCESS }
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
				dismissButton={ {
					onClick: dismissNotice,
				} }
			/>
		</Notification>
	);
}
