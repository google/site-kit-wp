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
import { Button } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import AnalyticsAdsenseLinkedGraphicDesktop from '../../../svg/graphics/analytics-adsense-linked-desktop.svg';
import AnalyticsAdsenseLinkedGraphicMobile from '../../../svg/graphics/analytics-adsense-linked-mobile.svg';
import { ANCHOR_ID_MONETIZATION } from '../../googlesitekit/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import useDashboardType, {
	DASHBOARD_TYPE_MAIN,
} from '../../hooks/useDashboardType';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { getContextScrollTop } from '../../util/scroll';
import OverlayNotification from './OverlayNotification';
import { isZeroReport } from '../../modules/analytics-4/utils/is-zero-report';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';

const { useSelect, useDispatch } = Data;

export const ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION =
	'AnalyticsAndAdSenseLinkedOverlayNotification';

export default function AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification() {
	const breakpoint = useBreakpoint();

	const dashboardType = useDashboardType();
	const isMainDashboard = dashboardType === DASHBOARD_TYPE_MAIN;

	const viewContext = useViewContext();

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
		)
	);

	const isDismissing = useSelect( ( select ) =>
		select( CORE_USER ).isDismissingItem(
			ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION
		)
	);

	const analyticsModuleConnected = useSelect( ( select ) => {
		if ( ! isMainDashboard || isDismissed ) {
			return null;
		}
		return select( CORE_MODULES ).isModuleConnected( 'analytics-4' );
	} );

	const adSenseModuleConnected = useSelect( ( select ) => {
		if ( ! isMainDashboard || isDismissed ) {
			return null;
		}
		return select( CORE_MODULES ).isModuleConnected( 'adsense' );
	} );

	const canViewSharedAnalytics = useSelect( ( select ) => {
		if ( ! isMainDashboard || isDismissed ) {
			return null;
		}
		return select( CORE_USER ).hasAccessToShareableModule( 'analytics-4' );
	} );
	const canViewSharedAdSense = useSelect( ( select ) => {
		if ( ! isMainDashboard || isDismissed ) {
			return null;
		}
		return select( CORE_USER ).hasAccessToShareableModule( 'adsense' );
	} );

	const isAdSenseLinked = useSelect( ( select ) => {
		if ( ! isMainDashboard || isDismissed ) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).getAdSenseLinked();
	} );

	const adSenseAccountID = useSelect( ( select ) => {
		if ( adSenseModuleConnected ) {
			return select( MODULES_ADSENSE ).getAccountID();
		}

		return null;
	} );

	const { startDate, endDate } = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportArgs = {
		startDate,
		endDate,
		dimensions: [ 'pagePath', 'adSourceName' ],
		metrics: [ { name: 'totalAdRevenue' } ],
		filter: {
			fieldName: 'adSourceName',
			stringFilter: {
				matchType: 'EXACT',
				value: `Google AdSense account (${ adSenseAccountID })`,
			},
		},
		orderby: [ { metric: { metricName: 'totalAdRevenue' }, desc: true } ],
		limit: 1,
	};

	const reportData = useSelect( ( select ) => {
		if (
			isMainDashboard &&
			isDismissed === false &&
			isAdSenseLinked &&
			adSenseModuleConnected &&
			analyticsModuleConnected &&
			canViewSharedAdSense &&
			canViewSharedAnalytics
		) {
			return select( MODULES_ANALYTICS_4 ).getReport( reportArgs );
		}

		return null;
	} );

	const reportDataAvailable = isZeroReport( reportData ) === false;

	const shouldShowNotification =
		isMainDashboard &&
		isDismissed === false &&
		analyticsModuleConnected &&
		adSenseModuleConnected &&
		canViewSharedAnalytics &&
		canViewSharedAdSense &&
		isAdSenseLinked &&
		reportDataAvailable;

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
				top: getContextScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );
		}, 50 );
	};

	return (
		<OverlayNotification
			shouldShowNotification={ shouldShowNotification }
			GraphicDesktop={ AnalyticsAdsenseLinkedGraphicDesktop }
			GraphicMobile={ AnalyticsAdsenseLinkedGraphicMobile }
			notificationID={ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION }
			gaEventCategory={ `${ viewContext }_top-earning-pages-widget` }
			gaEventAction="view_overlay_CTA"
		>
			<div className="googlesitekit-overlay-notification__body">
				<h3>
					{ __( 'See your top earning content', 'google-site-kit' ) }
				</h3>
				<p>
					{ __(
						'Data is now available for the pages that earn the most AdSense revenue.',
						'google-site-kit'
					) }
				</p>
			</div>

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
	);
}
