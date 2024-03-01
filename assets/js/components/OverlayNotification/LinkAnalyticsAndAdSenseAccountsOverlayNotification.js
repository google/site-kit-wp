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
import {
	LINK_ANALYTICS_ADSENSE_OVERLAY_DISMISSED,
	LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
} from './constants';
import OverlayNotificationBase from './OverlayNotificationBase';
import AnalyticsAdsenseConnectGraphic from '../../../svg/graphics/analytics-adsense-connect.svg';
import OverlayNotificationActions from './OverlayNotificationActions';
import OverlayNotificationContent from './OverlayNotificationContent';
import useViewOnly from '../../hooks/useViewOnly';
import { isFeatureEnabled } from '../../features';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

const { useSelect, useDispatch } = Data;

export default function LinkAnalyticsAndAdSenseAccountsOverlayNotification() {
	const isViewOnly = useViewOnly();

	const isShowingOverlayNotification = useSelect( ( select ) =>
		select( CORE_UI ).isShowingOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		)
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const { setOverlayNotificationToShow, dismissOverlayNotification } =
		useDispatch( CORE_UI );

	const supportURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/adsense/answer/6084409',
		} )
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			LINK_ANALYTICS_ADSENSE_OVERLAY_DISMISSED
		)
	);
	const ga4AdSenseIntegration = isFeatureEnabled( 'ga4AdSenseIntegration' );

	const AnalyticsModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
	} );
	const adSenseModuleConnected = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( CORE_MODULES ).isModuleConnected( 'adsense' );
	} );
	const isAdSenseLinked = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const analyticsAndAdSenseAreConnected =
		AnalyticsModuleConnected && adSenseModuleConnected;

	const shouldShowNotification =
		! isViewOnly &&
		false === isDismissed &&
		analyticsAndAdSenseAreConnected &&
		false === isAdSenseLinked &&
		ga4AdSenseIntegration;

	const dismissCallback = useCallback( () => {
		dismissItem( LINK_ANALYTICS_ADSENSE_OVERLAY_DISMISSED );
		dismissOverlayNotification(
			LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
		);
	}, [ dismissItem, dismissOverlayNotification ] );

	useEffect( () => {
		if (
			shouldShowNotification &&
			! isShowingOverlayNotification &&
			! isViewOnly
		) {
			setOverlayNotificationToShow(
				LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
			);
		}
	}, [
		shouldShowNotification,
		isShowingOverlayNotification,
		isViewOnly,
		setOverlayNotificationToShow,
	] );

	if (
		! shouldShowNotification ||
		! isShowingOverlayNotification ||
		isViewOnly
	) {
		return null;
	}

	return (
		<OverlayNotificationBase
			animateNotification={ isShowingOverlayNotification }
		>
			<AnalyticsAdsenseConnectGraphic />
			<OverlayNotificationContent
				heading={ __(
					'See which content earns you the most',
					'google-site-kit'
				) }
				text={ __(
					'Link your Analytics and AdSense accounts to find out which content brings you the most revenue.',
					'google-site-kit'
				) }
			/>

			<OverlayNotificationActions
				ariaLabel={ __(
					'Learn how (opens in a new tab)',
					'google-site-kit'
				) }
				ctaLink={ supportURL }
				ctaLabel={ __( 'Learn how', 'google-site-kit' ) }
				ctaTarget="_blank"
				ctaCallback={ dismissCallback }
				dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
				dismissCallback={ dismissCallback }
			/>
		</OverlayNotificationBase>
	);
}
