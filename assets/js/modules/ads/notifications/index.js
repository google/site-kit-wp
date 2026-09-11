/**
 * Ads module notification registrations.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	requireModuleConnected,
	requireModuleNotConnected,
	requireQueryArg,
} from '@/js/googlesitekit/data-requirements';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';
import {
	AccountLinkedViaGoogleForWooCommerceSubtleNotification,
	AdsModuleSetupCTABanner,
	PAXSetupSuccessSubtleNotification,
	SetupSuccessSubtleNotification,
} from '@/js/modules/ads/components/notifications';
import EnhancedConversionsNotification, {
	ENHANCED_CONVERSIONS_NOTIFICATION_ADS,
} from '@/js/modules/ads/components/notifications/EnhancedConversionsNotification';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import {
	requireGoogleForWooCommerceActivated,
	requireGoogleForWooCommerceAdsAccount,
	requireNoGoogleForWooCommerceAdsAccount,
	requireWooCommerceActivated,
} from '@/js/modules/ads/data-requirements';
import { PAX_SETUP_SUCCESS_NOTIFICATION } from '@/js/modules/ads/pax/constants';
import { asyncRequireAll } from '@/js/util/async';

export const ADS_NOTIFICATIONS = {
	'setup-success-notification-ads': {
		Component: SetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: asyncRequireAll(
			requireQueryArg( 'notification', 'authentication_success' ),
			requireQueryArg( 'slug', MODULE_SLUG_ADS )
		),
	},
	'setup-success-notification-pax': {
		Component: PAXSetupSuccessSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: requireQueryArg(
			'notification',
			PAX_SETUP_SUCCESS_NOTIFICATION
		),
	},
	'account-linked-via-google-for-woocommerce': {
		Component: AccountLinkedViaGoogleForWooCommerceSubtleNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireModuleNotConnected( MODULE_SLUG_ADS ),
			requireWooCommerceActivated(),
			requireGoogleForWooCommerceActivated(),
			requireGoogleForWooCommerceAdsAccount()
		),
		isDismissible: true,
	},
	'ads-setup-cta': {
		Component: AdsModuleSetupCTABanner,
		// This notification should be displayed before audience segmentation one,
		// which has priority of PRIORITY.SETUP_CTA_LOW
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireModuleNotConnected( MODULE_SLUG_ADS ),
			requireNoGoogleForWooCommerceAdsAccount()
		),
		isDismissible: true,
		dismissRetries: 1,
	},
	[ ENHANCED_CONVERSIONS_NOTIFICATION_ADS ]: {
		Component: EnhancedConversionsNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: requireModuleConnected( MODULE_SLUG_ADS ),
		isDismissible: true,
		featureFlag: 'gtagUserData',
	},
};

export function registerNotifications( notifications ) {
	createRegisterNotifications( notifications, ADS_NOTIFICATIONS );
}
