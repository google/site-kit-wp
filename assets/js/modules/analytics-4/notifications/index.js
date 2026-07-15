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
import { isFeatureEnabled } from '@/js/features';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
} from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { createRegisterNotifications } from '@/js/googlesitekit/notifications/util/create-register-notifications';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import IntroductoryOverlayNotification, {
	AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION,
} from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/IntroductoryOverlayNotification';
import SetupCTABanner, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/SetupCTABanner';
import { EnhancedMeasurementActivationBanner } from '@/js/modules/analytics-4/components/dashboard';
import {
	GoogleTagIDMismatchNotification,
	WebDataStreamNotAvailableNotification,
} from '@/js/modules/analytics-4/components/notifications';
import EnhancedConversionsNotification, {
	ENHANCED_CONVERSIONS_NOTIFICATION_ANALYTICS,
} from '@/js/modules/analytics-4/components/notifications/EnhancedConversionsNotification';
import IntroModal, {
	SITE_GOALS_INTRO_MODAL_BANNER,
} from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import {
	LEGACY_ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY as LEGACY_ENHANCED_MEASUREMENT_SETUP_CTA_DISMISSED_ITEM_KEY,
	MODULE_SLUG_ANALYTICS_4,
} from '@/js/modules/analytics-4/constants';
import {
	requireAudienceSegmentationSetupCompleted,
	requireAudienceSegmentationSetupCompletedByUser,
	requireDataIsAvailableOnLoad,
	requireEnhancedMeasurementEnabled,
	requireMismatchedGoogleTag,
	requireWebDataStreamUnavailable,
} from '@/js/modules/analytics-4/data-requirements';
import {
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { HOUR_IN_SECONDS } from '@/js/util';
import {
	asyncRequire,
	asyncRequireAll,
	asyncRequireAny,
} from '@/js/util/async';
import { isInitialWelcomeModalActive } from '@/js/util/welcome-modal';

export const ANALYTICS_4_NOTIFICATIONS = {
	[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
		Component: SetupCTABanner,
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
			asyncRequire( false, requireAudienceSegmentationSetupCompleted() ),
			async ( { resolveSelect, select } ) => {
				if ( ! isFeatureEnabled( 'setupFlowRefresh' ) ) {
					return true;
				}
				await resolveSelect( CORE_USER ).getInitialSetupSettings();
				return ! select( CORE_USER ).isAnalyticsSetupComplete();
			}
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
		Component: IntroductoryOverlayNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			( { select, dispatch } ) => {
				if (
					! isFeatureEnabled( 'setupFlowRefresh' ) ||
					! isInitialWelcomeModalActive()
				) {
					return true;
				}

				const isDismissing = select( CORE_USER ).isDismissingItem(
					AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
				);

				if ( ! isDismissing ) {
					dispatch( CORE_NOTIFICATIONS ).dismissNotification(
						AUDIENCE_SEGMENTATION_INTRODUCTORY_OVERLAY_NOTIFICATION
					);
				}

				return false;
			},
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
	[ SITE_GOALS_INTRO_MODAL_BANNER ]: {
		Component: IntroModal,
		// Shown after the welcome modal, which has a higher priority (lower
		// number), so the two modals never appear at the same time.
		priority: PRIORITY.SETUP_CTA_SITE_GOALS_INTRO_MODAL,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_MODALS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		featureFlag: 'siteGoals',
		checkRequirements: asyncRequireAll(
			// The welcome modal takes precedence. When it is active, defer the
			// Site Goals intro modal for 72 hours so the two are never shown at
			// the same time. Modeled on the audience segmentation introductory
			// overlay above. `shouldNotificationBeAddedToQueue` already filters
			// dismissed/still-deferred notifications out before
			// `checkRequirements` runs, so once the 72-hour dismissal is set
			// this code won't run again until it expires. This way: no separate
			// "already dismissed" check is needed.
			( { select, dispatch } ) => {
				if (
					! isFeatureEnabled( 'setupFlowRefresh' ) ||
					! isInitialWelcomeModalActive()
				) {
					return true;
				}

				const isDismissing = select( CORE_USER ).isDismissingItem(
					SITE_GOALS_INTRO_MODAL_BANNER
				);

				if ( ! isDismissing ) {
					dispatch( CORE_NOTIFICATIONS ).dismissNotification(
						SITE_GOALS_INTRO_MODAL_BANNER,
						{
							expiresInSeconds: 72 * HOUR_IN_SECONDS,
						}
					);
				}

				return false;
			},
			// At least one conversion event type must be detected.
			async ( { select, resolveSelect } ) => {
				await resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

				return (
					select(
						MODULES_ANALYTICS_4
					).hasEcommerceConversionReportingEvents() ||
					select(
						MODULES_ANALYTICS_4
					).hasLeadConversionReportingEvents()
				);
			},
			async ( { select, resolveSelect } ) => {
				await resolveSelect( CORE_USER ).getAuthentication();

				// If the user is not signed in, the check is skipped.
				//
				// The shared dashboard already limits view-only users appropriately,
				// we don't need to check their access here.
				if ( ! select( CORE_USER ).isAuthenticated() ) {
					return true;
				}

				// Make sure the user has access to the Analytics 4 module,
				// which is required to view the Site Goals modal.
				return (
					( await resolveSelect( CORE_MODULES ).hasModuleAccess(
						MODULE_SLUG_ANALYTICS_4
					) ) === true
				);
			}
		),
	},
};

export function registerNotifications( notifications ) {
	createRegisterNotifications( notifications, ANALYTICS_4_NOTIFICATIONS );
}
