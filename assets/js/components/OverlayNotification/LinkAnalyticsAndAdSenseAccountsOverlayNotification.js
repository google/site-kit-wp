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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import AnalyticsAdsenseConnectGraphic from '../../../svg/graphics/analytics-adsense-connect.svg';
import OverlayNotification from './OverlayNotification';
import OverlayNotificationActions from './OverlayNotificationActions';
import useViewOnly from '../../hooks/useViewOnly';
import { isFeatureEnabled } from '../../features';

const { useSelect, useDispatch } = Data;

export const LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION =
	'LinkAnalyticsAndAdSenseAccountsOverlayNotification';

export default function LinkAnalyticsAndAdSenseAccountsOverlayNotification() {
	const isViewOnly = useViewOnly();

	const isShowingNotification = useSelect( ( select ) =>
		select( CORE_UI ).isShowingOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)
	);

	const { setOverlayNotificationToShow, dismissOverlayNotification } =
		useDispatch( CORE_UI );

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/6084409',
		} )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)
	);
	const ga4AdSenseIntegration = isFeatureEnabled( 'ga4AdSenseIntegration' );

	const analyticsModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly || isDismissed ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
	} );

	const adSenseModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly || isDismissed ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'adsense' );
	} );

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( isViewOnly || isDismissed ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const analyticsAndAdSenseAreConnected =
		analyticsModuleConnected && adSenseModuleConnected;

	const shouldShowNotification =
		ga4AdSenseIntegration &&
		! isViewOnly &&
		analyticsAndAdSenseAreConnected &&
		isAdSenseLinked === false &&
		isDismissed === false;

	const dismissNotification = useCallback( () => {
		// Dismiss the notification, which also dismisses it from
		// the current users profile with the `dismissItem` action.
		dismissOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		);
	}, [ dismissOverlayNotification ] );

	useEffect( () => {
		if ( shouldShowNotification && ! isShowingNotification ) {
			// It is safe to trigger current overlay notification with check for
			// `isShowingCurrentOverlayNotification`, without checking if any overlay
			// notification is showing instead, because `setOverlayNotificationToShow`
			// action will not show it if another overlay notification is already showing.
			setOverlayNotificationToShow(
				LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
			);
		}
	}, [
		shouldShowNotification,
		isShowingNotification,
		isViewOnly,
		setOverlayNotificationToShow,
	] );

	if ( ! shouldShowNotification || ! isShowingNotification ) {
		return null;
	}

	return (
		<OverlayNotification animateNotification={ isShowingNotification }>
			<AnalyticsAdsenseConnectGraphic />

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

			<OverlayNotificationActions
				ariaLabel={ __(
					'Learn how (opens in a new tab)',
					'google-site-kit'
				) }
				ctaLink={ supportURL }
				ctaLabel={ __( 'Learn how', 'google-site-kit' ) }
				ctaTarget="_blank"
				ctaCallback={ dismissNotification }
				dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
				dismissCallback={ dismissNotification }
			/>
		</OverlayNotification>
	);
}
