/**
 * LinkAnalyticsAndAdSenseAccountsOverlayNotification component.
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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import AnalyticsAdsenseConnectGraphicDesktop from '../../../svg/graphics/analytics-adsense-connect-desktop.svg';
import AnalyticsAdsenseConnectGraphicMobile from '../../../svg/graphics/analytics-adsense-connect-mobile.svg';
import OverlayNotification from './OverlayNotification';

export const LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION =
	'LinkAnalyticsAndAdSenseAccountsOverlayNotification';

export default function LinkAnalyticsAndAdSenseAccountsOverlayNotification() {
	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/6084409',
		} )
	);

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)
	);

	const isAdSenseLinked = useSelect( ( select ) => {
		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const shouldShowNotification = isAdSenseLinked === false;

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		);
	};

	return (
		<OverlayNotification
			shouldShowNotification={ shouldShowNotification }
			GraphicDesktop={ AnalyticsAdsenseConnectGraphicDesktop }
			GraphicMobile={ AnalyticsAdsenseConnectGraphicMobile }
			notificationID={ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION }
		>
			<div className="googlesitekit-overlay-notification__body">
				<h3>
					{ __(
						'See which content earns you the most',
						'google-site-kit'
					) }
				</h3>
				<p>
					{ __(
						'Link your Analytics and AdSense accounts to find out which content brings you the most revenue.',
						'google-site-kit'
					) }
				</p>
			</div>

			<div className="googlesitekit-overlay-notification__actions">
				<Button
					tertiary
					disabled={ isDismissing }
					onClick={ dismissNotification }
				>
					{ __( 'Maybe later', 'google-site-kit' ) }
				</Button>

				<Button
					disabled={ isDismissing }
					href={ supportURL }
					target="_blank"
					onClick={ dismissNotification }
					aria-label={ __(
						'Learn how (opens in a new tab)',
						'google-site-kit'
					) }
				>
					{ __( 'Learn how', 'google-site-kit' ) }
				</Button>
			</div>
		</OverlayNotification>
	);
}
