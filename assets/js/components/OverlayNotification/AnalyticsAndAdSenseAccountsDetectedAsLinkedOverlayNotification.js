/**
 * AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification component.
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
import { useDispatch } from 'googlesitekit-data';
import AnalyticsAdsenseLinkedGraphicDesktop from '../../../svg/graphics/analytics-adsense-linked-desktop.svg';
import AnalyticsAdsenseLinkedGraphicMobile from '../../../svg/graphics/analytics-adsense-linked-mobile.svg';
import { ANCHOR_ID_MONETIZATION } from '../../googlesitekit/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { getNavigationalScrollTop } from '../../util/scroll';
import OverlayNotification from '../../googlesitekit/notifications/components/layout/OverlayNotification';
import useViewContext from '../../hooks/useViewContext';

export const ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION =
	'AnalyticsAndAdSenseLinkedOverlayNotification';

export default function AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();

	const viewContext = useViewContext();

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const scrollToWidgetAndDismissNotification = ( event ) => {
		event.preventDefault();

		dismissNotification( ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION );

		setTimeout( () => {
			const widgetClass =
				'.googlesitekit-widget--adsenseTopEarningPagesGA4';

			global.history.replaceState(
				{},
				'',
				`#${ ANCHOR_ID_MONETIZATION }`
			);
			global.scrollTo( {
				top: getNavigationalScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	const gaTrackingEventArgs = {
		category: `${ viewContext }_top-earning-pages-widget`,
		viewAction: 'view_overlay_CTA',
		dismissAction: 'dismiss_overlay_CTA',
		confirmAction: 'confirm_overlay_CTA',
	};

	return (
		<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
			<OverlayNotification
				notificationID={ id }
				title={ __(
					'See your top earning content',
					'google-site-kit'
				) }
				description={ __(
					'Data is now available for the pages that earn the most AdSense revenue.',
					'google-site-kit'
				) }
				GraphicDesktop={ AnalyticsAdsenseLinkedGraphicDesktop }
				GraphicMobile={ AnalyticsAdsenseLinkedGraphicMobile }
				dismissButton
				ctaButton={ {
					label: __( 'Show me', 'google-site-kit' ),
					onClick: scrollToWidgetAndDismissNotification,
				} }
				gaTrackingEventArgs={ gaTrackingEventArgs }
			/>
		</Notification>
	);
}
