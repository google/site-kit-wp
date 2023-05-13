/**
 * AdBlockingRecoveryNotification component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import BannerNotification from './BannerNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
const { useDispatch, useSelect } = Data;

export default function AdBlockingRecoveryNotification() {
	const NOTIFICATION_ID = 'ad-blocking-recovery-setup-success';

	const adBlockingRecoverySetupStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
	);

	const isNotificationDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed( NOTIFICATION_ID )
	);

	const { dismissItem } = useDispatch( CORE_USER );

	if (
		adBlockingRecoverySetupStatus !== 'setup-confirmed' ||
		isNotificationDismissed
	) {
		return null;
	}

	return (
		<BannerNotification
			id={ NOTIFICATION_ID }
			title={ __(
				'You successfully added the ad blocking recovery tag',
				'google-site-kit'
			) }
			description={ __(
				'Make sure to also create the message in AdSense, otherwise this feature won’t work.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'OK, Got it!', 'google-site-kit' ) }
			onCTAClick={ () => dismissItem( NOTIFICATION_ID ) }
			type="win-success"
		/>
	);
}
