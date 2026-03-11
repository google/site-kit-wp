/**
 * Analytics module notification registrations.
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
import { GTM_SCOPE } from '@/js/modules/analytics-4/datastore/constants';
import { EnhancedMeasurementActivationBanner } from '@/js/modules/analytics-4/components/dashboard';
import AudienceSegmentationIntroductoryOverlayNotification, {
	AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationIntroductoryOverlayNotification';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import AudienceSegmentationSetupCTABanner, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationSetupCTABanner';
import {
	WebDataStreamNotAvailableNotification,
	GoogleTagIDMismatchNotification,
} from '@/js/modules/analytics-4/components/notifications';
import {
	LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY as LEGACY_ENHANCED_MEASUREMENT_SETUP_CTA_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ANALYTICS_4,
} from '@/js/modules/analytics-4/constants';
import EnhancedConversionsNotification, {
	ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS,
} from '@/js/modules/analytics-4/components/notifications/EnhancedConversionsNotification';
import {
	asyncRequire,
	asyncRequireAll,
	asyncRequireAny,
} from '@/js/util/async';
import {
	requireAudienceSegmentationWidgetHidden,
	requireCanViewSharedModule,
	requireIsAuthenticated,
	requireItemDismissed,
	requireModuleAccess,
	requireModuleConnected,
	requireModuleOwnership,
	requireScope,
} from '@/js/googlesitekit/data-requirements';
import {
	requireAudienceSegmentationSetupCompleted,
	requireAudienceSegmentationSetupCompletedByUser,
	requireDataIsAvailableOnLoad,
	requireEnhancedMeasurementEnabled,
	requireMismatchedGoogleTag,
	requireWebDataStreamUnavailable,
} from '@/js/modules/analytics-4/data-requirements';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';

export const ANALYTICS_4_NOTIFICATIONS = {
	[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
		Component: AudienceSegmentationSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			asyncRequireAny(
				requireIsAuthenticated(),
				requireCanViewSharedModule( MODULE_SLUG_ANALYTICS_4 )
			),
			requireDataIsAvailableOnLoad(),
			asyncRequire( false, requireAudienceSegmentationSetupCompleted() )
		),
		isDismissible: true,
		dismissRetries: 1,
	},
	'web-data-stream-not-available-notification': {
		Component: WebDataStreamNotAvailableNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			requireModuleOwnership( MODULE_SLUG_ANALYTICS_4 ),
			requireScope( GTM_SCOPE ),
			// Require connected datastream is NOT available.
			requireWebDataStreamUnavailable()
		),
	},
	'google-tag-id-mismatch': {
		Component: GoogleTagIDMismatchNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: false,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			requireModuleOwnership( MODULE_SLUG_ANALYTICS_4 ),
			requireScope( GTM_SCOPE ),
			requireMismatchedGoogleTag()
		),
	},
	'enhanced-measurement-notification': {
		Component: EnhancedMeasurementActivationBanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			// Check if the prompt with the legacy key used before the banner was refactored
			// to use the `notification ID` as the dismissal key, is dismissed.
			asyncRequire(
				false,
				requireItemDismissed(
					LEGACY_ENHANCED_MEASUREMENT_SETUP_CTA_DISMISSED_ITEM_KEY
				)
			),
			asyncRequireAny(
				requireModuleOwnership( MODULE_SLUG_ANALYTICS_4 ),
				requireModuleAccess( MODULE_SLUG_ANALYTICS_4 )
			),
			asyncRequire( false, requireEnhancedMeasurementEnabled() )
		),
	},
	[ AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION ]: {
		Component: AudienceSegmentationIntroductoryOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			asyncRequireAny(
				requireIsAuthenticated(),
				requireCanViewSharedModule( MODULE_SLUG_ANALYTICS_4 )
			),
			requireAudienceSegmentationSetupCompleted(),
			asyncRequire( false, requireAudienceSegmentationWidgetHidden() ),
			asyncRequire(
				false,
				requireAudienceSegmentationSetupCompletedByUser()
			)
		),
	},
	[ ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS ]: {
		Component: EnhancedConversionsNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			asyncRequire( false, requireModuleConnected( MODULE_SLUG_ADS ) )
		),
		isDismissible: true,
		featureFlag: 'gtagUserData',
	},
};

export function registerNotifications( notifications ) {
	createRegisterNotifications( notifications, ANALYTICS_4_NOTIFICATIONS );
}
