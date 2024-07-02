/**
 * AdSenseAlerts component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import NotificationAlertSVG from '../../../svg/graphics/notification-alert.svg';
import BannerNotification from '../notifications/BannerNotification';

function AdSenseAlerts() {
	const adSenseModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'adsense' )
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const notifications = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getNotifications()
	);

	if (
		! adSenseModuleConnected ||
		! accountID ||
		notifications === undefined
	) {
		return null;
	}

	return (
		<Fragment>
			{ notifications.map(
				( {
					id,
					title,
					description,
					format,
					ctaURL,
					ctaLabel,
					ctaTarget,
					severity,
					isDismissable,
				} ) => (
					<BannerNotification
						key={ id }
						id={ id }
						title={ title || '' }
						description={ description }
						WinImageSVG={ NotificationAlertSVG }
						format={ format || 'small' }
						ctaLink={ ctaURL }
						ctaLabel={ ctaLabel }
						ctaTarget={ ctaTarget }
						type={ severity }
						dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
						isDismissible={ isDismissable || true }
						logo
						module="adsense"
						moduleName={ _x(
							'AdSense',
							'Service name',
							'google-site-kit'
						) }
						dismissExpires={ 0 }
						showOnce={ false }
					/>
				)
			) }
		</Fragment>
	);
}

export default AdSenseAlerts;
