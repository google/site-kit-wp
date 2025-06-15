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
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import AnalyticsAdsenseLinkedGraphicDesktop from '../../../svg/graphics/analytics-adsense-linked-desktop.svg';
import AnalyticsAdsenseLinkedGraphicMobile from '../../../svg/graphics/analytics-adsense-linked-mobile.svg';
import { ANCHOR_ID_MONETIZATION } from '../../googlesitekit/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MODULE_SLUG_ADSENSE } from '../../modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../modules/analytics-4/constants';
import { getNavigationalScrollTop } from '../../util/scroll';
import OverlayNotification from '../../googlesitekit/notifications/components/layout/OverlayNotification';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import whenActive from '../../util/when-active';

export const ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION =
	'AnalyticsAndAdSenseLinkedOverlayNotification';

function AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();

	const viewContext = useViewContext();

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
		)
	);

	const { dismissOverlayNotification } = useDispatch( CORE_UI );

	const dismissNotification = () => {
		// Dismiss the notification, which also dismisses it from
		// the current user's profile with the `dismissItem` action.
		dismissOverlayNotification(
			ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
		);
	};

	const scrollToWidgetAndDismissNotification = ( event ) => {
		event.preventDefault();

		dismissNotification();

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
			>
				<div className="googlesitekit-overlay-notification__actions">
					<Button
						tertiary
						disabled={ isDismissing }
						onClick={ () => {
							dismissNotification();

							trackEvent(
								`${ viewContext }_top-earning-pages-widget`,
								'dismiss_overlay_CTA'
							);
						} }
					>
						{ __( 'Maybe later', 'google-site-kit' ) }
					</Button>

					<Button
						disabled={ isDismissing }
						onClick={ ( event ) => {
							scrollToWidgetAndDismissNotification( event );

							trackEvent(
								`${ viewContext }_top-earning-pages-widget`,
								'confirm_overlay_CTA'
							);
						} }
					>
						{ __( 'Show me', 'google-site-kit' ) }
					</Button>
				</div>
			</OverlayNotification>
		</Notification>
	);
}

export default compose(
	whenActive( { moduleName: MODULE_SLUG_ANALYTICS_4 } ),
	whenActive( { moduleName: MODULE_SLUG_ADSENSE } )
)( AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification );
