/**
 * AdSense module initialization.
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
import { __ } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';
import { SetupMain } from './components/setup';
import {
	SettingsEdit,
	SettingsSetupIncomplete,
	SettingsView,
} from './components/settings';
import {
	AdBlockingRecoverySetupCTAWidget,
	AdBlockerWarningWidget,
	AdSenseConnectCTAWidget,
	DashboardTopEarningPagesWidgetGA4,
} from './components/dashboard';
import { ModuleOverviewWidget } from './components/module';
import AdSenseIcon from '@/svg/graphics/adsense.svg';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from './datastore/constants';
import { MODULE_SLUG_ADSENSE } from './constants';
import { TopEarningContentWidget } from './components/widgets';
import {
	CORE_USER,
	ERROR_CODE_ADBLOCKER_ACTIVE,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '@/js/googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	DATE_RANGE_OFFSET,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import AdBlockingRecoverySetupSuccessNotification from './components/dashboard/AdBlockingRecoverySetupSuccessNotification';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import DashboardMainEffectComponent from './components/DashboardMainEffectComponent';
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from '@/js/components/OverlayNotification/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import LinkAnalyticsAndAdSenseAccountsOverlayNotification, {
	LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
} from '@/js/components/OverlayNotification/LinkAnalyticsAndAdSenseAccountsOverlayNotification';
import { isZeroReport } from '@/js/modules/analytics-4/utils';
export { registerStore } from './datastore';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_ADSENSE, {
		storeName: MODULES_ADSENSE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SettingsSetupIncompleteComponent: SettingsSetupIncomplete,
		SetupComponent: SetupMain,
		DashboardMainEffectComponent,
		Icon: AdSenseIcon,
		features: [
			__(
				'Intelligent, automatic ad placement will be disabled',
				'google-site-kit'
			),
			__(
				'You will miss out on revenue from ads placed on your site',
				'google-site-kit'
			),
			__(
				'You will lose access to AdSense insights through Site Kit',
				'google-site-kit'
			),
		],
		checkRequirements: async ( registry ) => {
			const adBlockerActive = await registry
				.resolveSelect( CORE_USER )
				.isAdBlockerActive();

			if ( ! adBlockerActive ) {
				return;
			}

			const message = registry
				.select( MODULES_ADSENSE )
				.getAdBlockerWarningMessage();

			throw {
				code: ERROR_CODE_ADBLOCKER_ACTIVE,
				message,
				data: null,
			};
		},
	} );
}

export function registerWidgets( widgets ) {
	widgets.registerWidget(
		'adBlockingRecovery',
		{
			Component: AdBlockingRecoverySetupCTAWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	/*
	 * Key metrics widgets.
	 */
	widgets.registerWidget(
		KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
		{
			Component: TopEarningContentWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				const isViewOnly = ! select( CORE_USER ).isAuthenticated();

				if (
					! select( CORE_USER ).isKeyMetricActive(
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT
					)
				) {
					return false;
				}

				const isAdSenseLinked =
					select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

				if ( isViewOnly && ! isAdSenseLinked ) {
					return false;
				}

				return true;
			},
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		'adBlockerWarning',
		{
			Component: AdBlockerWarningWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	widgets.registerWidget(
		'adsenseModuleOverview',
		{
			Component: ModuleOverviewWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 2,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	widgets.registerWidget(
		'adsenseConnectCTA',
		{
			Component: AdSenseConnectCTAWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 2,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	// Register widget reliant on Analytics 4 (GA4).
	widgets.registerWidget(
		'adsenseTopEarningPagesGA4',
		{
			Component: DashboardTopEarningPagesWidgetGA4,
			width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);
}

export const ADSENSE_NOTIFICATIONS = {
	'adsense-abr-success-notification': {
		Component: AdBlockingRecoverySetupSuccessNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			// Check the query arg first as the simplest condition using global location.
			const notification = getQueryArg( location.href, 'notification' );
			if ( notification !== 'ad_blocking_recovery_setup_success' ) {
				return false;
			}

			const { isModuleConnected } = resolveSelect( CORE_MODULES );
			if ( ! ( await isModuleConnected( MODULE_SLUG_ADSENSE ) ) ) {
				return false;
			}

			await resolveSelect( MODULES_ADSENSE ).getSettings();
			const adBlockingRecoverySetupStatus =
				select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus();

			if (
				adBlockingRecoverySetupStatus ===
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			) {
				return true;
			}

			return false;
		},
	},
	[ ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION ]: {
		Component:
			AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The hasAccessToShareableModule() selector relies on
				// the resolution of getAuthentication().
				resolveSelect( CORE_USER ).getAuthentication(),
				// The isModuleConnected() and hasAccessToShareableModule() selectors
				// rely on the resolution of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const adSenseModuleConnected =
				select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADSENSE );

			const analyticsModuleConnected = select(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

			const canViewSharedAdsense =
				select( CORE_USER ).hasAccessToShareableModule(
					MODULE_SLUG_ADSENSE
				);

			const canViewSharedAnalytics = select(
				CORE_USER
			).hasAccessToShareableModule( MODULE_SLUG_ANALYTICS_4 );

			if (
				! (
					adSenseModuleConnected &&
					analyticsModuleConnected &&
					canViewSharedAdsense &&
					canViewSharedAnalytics
				)
			) {
				return false;
			}

			// The getAdSenseLinked() selector relies on the resolution
			// of the getSettings() resolver.
			await resolveSelect( MODULES_ANALYTICS_4 ).getSettings();
			const isAdSenseLinked =
				select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

			if ( ! isAdSenseLinked ) {
				return false;
			}

			// The getAccountID() selector relies on the resolution
			// of the getSettings() resolver.
			await resolveSelect( MODULES_ADSENSE ).getSettings();
			const adSenseAccountID = select( MODULES_ADSENSE ).getAccountID();

			const { startDate, endDate } = select(
				CORE_USER
			).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

			const reportArgs = {
				startDate,
				endDate,
				dimensions: [ 'pagePath', 'adSourceName' ],
				metrics: [ { name: 'totalAdRevenue' } ],
				dimensionFilters: {
					adSourceName: `Google AdSense account (${ adSenseAccountID })`,
				},
				orderby: [
					{ metric: { metricName: 'totalAdRevenue' }, desc: true },
				],
				limit: 1,
				reportID:
					'notifications_analytics-adsense-linked-overlay_reportArgs',
			};

			const reportData = await resolveSelect(
				MODULES_ANALYTICS_4
			).getReport( reportArgs );

			return isZeroReport( reportData ) === false;
		},
	},
	[ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION ]: {
		Component: LinkAnalyticsAndAdSenseAccountsOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const adSenseModuleConnected =
				select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADSENSE );

			const analyticsModuleConnected = select(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

			if ( ! ( adSenseModuleConnected && analyticsModuleConnected ) ) {
				return false;
			}

			// The getAdSenseLinked() selector relies on the resolution
			// of the getSettings() resolver.
			await resolveSelect( MODULES_ANALYTICS_4 ).getSettings();
			const isAdSenseLinked =
				select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

			return isAdSenseLinked === false;
		},
	},
};

export function registerNotifications( notifications ) {
	for ( const notificationID in ADSENSE_NOTIFICATIONS ) {
		notifications.registerNotification(
			notificationID,
			ADSENSE_NOTIFICATIONS[ notificationID ]
		);
	}
}
