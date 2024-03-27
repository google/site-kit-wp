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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import AnalyticsAdsenseConnectGraphic from '../../../svg/graphics/analytics-adsense-connect.svg';
import OverlayNotification from './OverlayNotification';
import useViewOnly from '../../hooks/useViewOnly';
import { useFeature } from '../../hooks/useFeature';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../hooks/useDashboardType';

const { useSelect, useDispatch } = Data;

export const LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION =
	'LinkAnalyticsAndAdSenseAccountsOverlayNotification';

export default function LinkAnalyticsAndAdSenseAccountsOverlayNotification() {
	const isGA4AdSenseIntegrationEnabled = useFeature(
		'ga4AdSenseIntegration'
	);

	const isViewOnly = useViewOnly();
	const dashboardType = useDashboardType();
	const isMainDashboard = dashboardType === DASHBOARD_TYPE_MAIN;

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

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)
	);

	const analyticsModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly || ! isMainDashboard || isDismissed ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
	} );

	const adSenseModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly || ! isMainDashboard || isDismissed ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'adsense' );
	} );

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( isViewOnly || ! isMainDashboard || isDismissed ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const analyticsAndAdSenseAreConnected =
		analyticsModuleConnected && adSenseModuleConnected;

	const shouldShowNotification =
		isGA4AdSenseIntegrationEnabled &&
		! isViewOnly &&
		isMainDashboard &&
		analyticsAndAdSenseAreConnected &&
		isAdSenseLinked === false &&
		isDismissed === false;

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		);
	};

	useEffect( () => {
		// If the conditions to show this notification are met AND no other
		// notifications are showing, show this notification.
		if ( shouldShowNotification && ! isShowingNotification ) {
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
