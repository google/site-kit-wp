/**
 * AdSense module notification registrations.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * Internal dependencies
 */
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from '@/js/components/OverlayNotification/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import LinkAnalyticsAndAdSenseAccountsOverlayNotification, {
	LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
} from '@/js/components/OverlayNotification/LinkAnalyticsAndAdSenseAccountsOverlayNotification';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	requireAccessToShareableModule,
	requireModuleConnected,
	requireQueryArg,
} from '@/js/googlesitekit/data-requirements';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';
import AdBlockingRecoverySetupSuccessNotification from '@/js/modules/adsense/components/dashboard/AdBlockingRecoverySetupSuccessNotification';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import {
	requireAdBlockingRecoverySetupStatus,
	requireAdSenseRevenueInAnalytics,
} from '@/js/modules/adsense/data-requirements';
import { ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS } from '@/js/modules/adsense/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	requireAdSenseLinked,
	requireAdSenseNotLinked,
} from '@/js/modules/analytics-4/data-requirements';
import { asyncRequireAll } from '@/js/util/async';

export const ADSENSE_NOTIFICATIONS = {
	'adsense-abr-success-notification': {
		Component: AdBlockingRecoverySetupSuccessNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			// Check the query arg first as the simplest condition using global location.
			requireQueryArg(
				'notification',
				'ad_blocking_recovery_setup_success'
			),
			requireModuleConnected( MODULE_SLUG_ADSENSE ),
			requireAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			)
		),
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
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ADSENSE ),
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			requireAccessToShareableModule( MODULE_SLUG_ADSENSE ),
			requireAccessToShareableModule( MODULE_SLUG_ANALYTICS_4 ),
			requireAdSenseLinked(),
			requireAdSenseRevenueInAnalytics()
		),
	},
	[ LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION ]: {
		Component: LinkAnalyticsAndAdSenseAccountsOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ADSENSE ),
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			requireAdSenseNotLinked()
		),
	},
};

export function registerNotifications( notifications ) {
	createRegisterNotifications( notifications, ADSENSE_NOTIFICATIONS );
}
