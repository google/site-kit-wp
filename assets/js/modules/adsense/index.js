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
} from '../../googlesitekit/widgets/default-areas';
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
import AdSenseIcon from '../../../svg/graphics/adsense.svg';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from './datastore/constants';
import { TopEarningContentWidget } from './components/widgets';
import {
	CORE_USER,
	ERROR_CODE_ADBLOCKER_ACTIVE,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../analytics-4/datastore/constants';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import AdBlockingRecoverySetupSuccessNotification from './components/dashboard/AdBlockingRecoverySetupSuccessNotification';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'adsense', {
		storeName: MODULES_ADSENSE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SettingsSetupIncompleteComponent: SettingsSetupIncomplete,
		SetupComponent: SetupMain,
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
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'adBlockingRecovery',
		{
			Component: AdBlockingRecoverySetupCTAWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ 'adsense' ],
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
			modules: [ 'adsense', 'analytics-4' ],
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
			modules: [ 'adsense' ],
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
			modules: [ 'adsense' ],
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
			modules: [ 'adsense' ],
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
			modules: [ 'adsense', 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);
};

export const ADSENSE_NOTIFICATIONS = {
	'adsense-abr-success-notification': {
		Component: AdBlockingRecoverySetupSuccessNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			const { isModuleConnected } = resolveSelect( CORE_MODULES );
			if ( ! ( await isModuleConnected( 'adsense' ) ) ) {
				return false;
			}

			await resolveSelect( MODULES_ADSENSE ).getSettings();
			const adBlockingRecoverySetupStatus =
				select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus();

			const notification = getQueryArg( location.href, 'notification' );

			if (
				adBlockingRecoverySetupStatus ===
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED &&
				notification === 'ad_blocking_recovery_setup_success'
			) {
				return true;
			}
			return false;
		},
	},
};

export const registerNotifications = ( notifications ) => {
	for ( const notificationID in ADSENSE_NOTIFICATIONS ) {
		notifications.registerNotification(
			notificationID,
			ADSENSE_NOTIFICATIONS[ notificationID ]
		);
	}
};
