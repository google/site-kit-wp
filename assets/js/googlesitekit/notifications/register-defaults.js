/**
 * Notifications API defaults
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ConsentModeSetupCTABanner from '@/js/components/consent-mode/ConsentModeSetupCTABanner';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from '@/js/components/consent-mode/constants';
import ModuleRecoveryAlert from '@/js/components/dashboard-sharing/ModuleRecoveryAlert';
import SetUpEmailReportingOverlayNotification, {
	SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION,
} from '@/js/components/email-reporting/SetUpEmailReportingOverlayNotification';
import ActivateAnalyticsNotification from '@/js/components/notifications/ActivateAnalyticsNotification';
import AuthError from '@/js/components/notifications/AuthError';
import ConnectMoreServicesNotification from '@/js/components/notifications/ConnectMoreServicesNotification';
import EnableAutoUpdateBannerNotification, {
	ENABLE_AUTO_UPDATES_BANNER_SLUG,
} from '@/js/components/notifications/EnableAutoUpdateBannerNotification';
import createFeatureTourNotification from '@/js/components/notifications/FeatureTourNotification';
import GA4AdSenseLinkedNotification from '@/js/components/notifications/GA4AdSenseLinkedNotification';
import GatheringDataNotification from '@/js/components/notifications/GatheringDataNotification';
import GoogleTagGatewaySetupBanner from '@/js/components/notifications/GoogleTagGatewaySetupBanner';
import GoogleTagGatewayWarningNotification from '@/js/components/notifications/GoogleTagGatewayWarningNotification';
import ModuleSetupSuccessNotification from '@/js/components/notifications/ModuleSetupSuccessNotification';
import SetupErrorMessageNotification from '@/js/components/notifications/SetupErrorMessageNotification';
import SiteKitSetupSuccessNotification from '@/js/components/notifications/SiteKitSetupSuccessNotification';
import UnsatisfiedScopesAlert from '@/js/components/notifications/UnsatisfiedScopesAlert';
import UnsatisfiedScopesAlertGTE from '@/js/components/notifications/UnsatisfiedScopesAlertGTE';
import ZeroDataNotification from '@/js/components/notifications/ZeroDataNotification';
import { PDF_INTRODUCTION_OVERLAY_NOTIFICATION } from '@/js/components/pdf-export/constants';
import PDFIntroductionOverlayNotification from '@/js/components/pdf-export/PDFIntroductionOverlayNotification';
import SplashSetupErrorMessageNotification from '@/js/components/setup/SetupUsingProxyWithSignIn/SplashSetupErrorMessageNotification';
import WelcomeModal, {
	WELCOME_MODAL_NOTIFICATION,
} from '@/js/components/WelcomeModal';
import sharedKeyMetrics from '@/js/feature-tours/shared-key-metrics';
import { isFeatureEnabled } from '@/js/features';
import {
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_SPLASH,
} from '@/js/googlesitekit/constants';
import {
	requireAccessToFeatureTour,
	requireAdsConnected,
	requireAnyGoogleTagGatewayModuleConnected,
	requireAuthError,
	requireCanActivateModule,
	requireCanChangePluginAutoUpdates,
	requireCanViewSharedModule,
	requireCapability,
	requireConsentModeDisabled,
	requireDataGatheringCompleteModalActive,
	requireEmailReportingSubscribed,
	requireGTGHealthy,
	requireGTGScriptAccessEnabled,
	requireGoogleTagGatewayEnabled,
	requireHasRecoverableModules,
	requireIsAuthenticated,
	requireModuleActive,
	requireModuleConnected,
	requireModuleGatheringData,
	requireModuleRecoverable,
	requireModuleViewable,
	requireModuleZeroData,
	requireQueryArg,
	requireScope,
	requireSetupError,
	requireSiteEmailReportingNotDisabled,
	requireSiteKitAutoUpdatesEnabled,
	requireUnsatisfiedScopes,
	requireUnsatisfiedScopesCount,
	requireViewOnlyContext,
} from '@/js/googlesitekit/data-requirements';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
	PERMISSION_UPDATE_PLUGINS,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { requireAdSenseLinked } from '@/js/modules/analytics-4/data-requirements';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { isZeroReport } from '@/js/modules/analytics-4/utils';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '@/js/modules/tagmanager/datastore/constants';
import { MINUTE_IN_SECONDS } from '@/js/util';
import {
	asyncRequire,
	asyncRequireAll,
	asyncRequireAny,
} from '@/js/util/async';
import { isInitialWelcomeModalActive } from '@/js/util/welcome-modal';
import {
	ACTIVATE_ANALYTICS_NOTIFICATION,
	CONNECT_MORE_SERVICES_NOTIFICATION,
	GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
	GTG_SETUP_CTA_BANNER_NOTIFICATION,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
	PRIORITY,
	SITE_KIT_SETUP_SUCCESS_NOTIFICATION,
} from './constants';
import { CORE_NOTIFICATIONS } from './datastore/constants';
import { requireSetupCTAsNotHidden } from './util/setup-cta-visibility';

/**
 * Requires the current page load to be the one directly following the initial
 * Site Kit setup.
 *
 * The module setup success notification is identified by the same query
 * argument plus a module `slug`, so the absence of a `slug` is what makes this
 * check specific to the initial Site Kit setup.
 *
 * @since n.e.x.t
 *
 * @return {function(): Promise<boolean>} Whether this page load follows the initial setup or not.
 */
function requireInitialSetupSuccess() {
	return asyncRequireAll(
		requireQueryArg( 'notification', 'authentication_success' ),
		asyncRequire( false, requireQueryArg( 'slug' ) )
	);
}

/**
 * Requires the given module's data to be viewable in the current view context.
 *
 * Outside view-only contexts there is nothing to check, since the module's own
 * dashboard already gates access. In view-only contexts the module must be
 * shared with the current user and must not be in the recovering state.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {function(): Promise<boolean>} Whether the module's data is viewable or not.
 */
function requireModuleDataViewable( slug ) {
	return asyncRequireAny(
		asyncRequire( false, requireViewOnlyContext() ),
		asyncRequireAll(
			requireCanViewSharedModule( slug ),
			asyncRequire( false, requireModuleRecoverable( slug ) )
		)
	);
}

/**
 * Requires the given module to be connected and its data to be viewable in the
 * current view context.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {function(): Promise<boolean>} Whether the module's data is available or not.
 */
function requireModuleDataAvailable( slug ) {
	return asyncRequireAll(
		requireModuleConnected( slug ),
		requireModuleDataViewable( slug )
	);
}

export const DEFAULT_NOTIFICATIONS = {
	[ CONNECT_MORE_SERVICES_NOTIFICATION ]: {
		Component: ConnectMoreServicesNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			asyncRequire(
				false,
				requireModuleGatheringData( MODULES_ANALYTICS_4 )
			),
			asyncRequire(
				false,
				requireModuleGatheringData( MODULES_SEARCH_CONSOLE )
			),
			requireIsAuthenticated()
		),
		featureFlag: 'setupFlowRefresh',
	},
	[ ACTIVATE_ANALYTICS_NOTIFICATION ]: {
		Component: ActivateAnalyticsNotification,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		dismissRetries: 2,
		checkRequirements: asyncRequireAll(
			asyncRequire(
				false,
				requireModuleActive( MODULE_SLUG_ANALYTICS_4 )
			),
			asyncRequire(
				false,
				requireModuleGatheringData( MODULES_SEARCH_CONSOLE )
			),
			requireIsAuthenticated(),
			requireCanActivateModule( MODULE_SLUG_ANALYTICS_4 )
		),
		featureFlag: 'setupFlowRefresh',
	},
	'authentication-error': {
		Component: UnsatisfiedScopesAlert,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: asyncRequireAll(
			requireUnsatisfiedScopes(),
			requireIsAuthenticated(),
			// The Google Tag Gateway variant of this alert takes over when the
			// Tag Manager read scope is the only scope left to grant for a
			// connected Analytics module, so this alert must stand down.
			asyncRequire(
				false,
				asyncRequireAll(
					requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
					asyncRequire(
						false,
						requireScope( TAGMANAGER_READ_SCOPE )
					),
					requireUnsatisfiedScopesCount( 1 )
				)
			)
		),
		isDismissible: false,
	},
	'authentication-error-gte': {
		Component: UnsatisfiedScopesAlertGTE,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: asyncRequireAll(
			requireIsAuthenticated(),
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			asyncRequire( false, requireScope( TAGMANAGER_READ_SCOPE ) )
		),
		isDismissible: false,
	},
	setup_plugin_error: {
		Component: SetupErrorMessageNotification,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
			...( isFeatureEnabled( 'setupFlowRefreshPhase4' )
				? []
				: [ VIEW_CONTEXT_SPLASH ] ),
		],
		checkRequirements: asyncRequireAll(
			// A temporarily persisted permissions error can opt out of the
			// default error notifications. This is checked first because it
			// needs no data resolution.
			( { select } ) =>
				! select( CORE_FORMS ).getValue(
					FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
					'permissionsError'
				)?.data?.skipDefaultErrorNotifications,
			requireSetupError()
		),
		isDismissible: false,
	},
	'splash-setup-plugin-error': {
		Component: SplashSetupErrorMessageNotification,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.SPLASH_CONTENT,
		viewContexts: [ VIEW_CONTEXT_SPLASH ],
		checkRequirements: requireSetupError(),
		isDismissible: false,
		featureFlag: 'setupFlowRefreshPhase4',
	},
	'auth-error': {
		Component: AuthError,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: requireAuthError(),
		isDismissible: false,
	},
	'top-earning-pages-success-notification': {
		Component: GA4AdSenseLinkedNotification,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
		],
		checkRequirements: asyncRequireAll(
			requireModuleConnected( MODULE_SLUG_ADSENSE ),
			requireModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
			requireAdSenseLinked(),
			async ( { select, resolveSelect, dispatch } ) => {
				const { startDate, endDate } =
					select( CORE_USER ).getDateRangeDates();

				const reportOptions = {
					startDate,
					endDate,
					dimensions: [ 'pagePath' ],
					metrics: [ { name: 'totalAdRevenue' } ],
					orderby: [
						{
							metric: { metricName: 'totalAdRevenue' },
							desc: true,
						},
					],
					limit: 3,
					reportID:
						'notifications_top-earning-pages-success-notification_reportOptions',
				};

				// Ensure resolution of the report has completed before showing this
				// notification, since it should only appear when the user has no data in
				// the report.
				const report = await resolveSelect(
					MODULES_ANALYTICS_4
				).getReport( reportOptions );

				// This notification should only appear when the user has connected their
				// AdSense and Google Analytics accounts, but has not yet received any data
				// from linking the accounts. If they have any data from the "linked" report,
				// we show them a different notification and should not show this one. Check
				// to see if the user already has data and dismiss this notification without
				// showing it.
				if ( isZeroReport( report ) === false ) {
					await dispatch( CORE_NOTIFICATIONS ).dismissNotification(
						'top-earning-pages-success-notification'
					);
					return false;
				}

				return true;
			}
		),
		isDismissible: true,
	},
	[ SITE_KIT_SETUP_SUCCESS_NOTIFICATION ]: {
		Component: SiteKitSetupSuccessNotification,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: requireInitialSetupSuccess(),
	},
	'setup-success-notification-module': {
		Component: ModuleSetupSuccessNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireQueryArg( 'notification', 'authentication_success' ),
			async ( { select, resolveSelect } ) => {
				// The getModule() selector relies on the resolution
				// of the getModules() resolver.
				await resolveSelect( CORE_MODULES ).getModules();

				const module = select( CORE_MODULES ).getModule(
					getQueryArg( location.href, 'slug' )
				);

				return (
					false === module?.overrideSetupSuccessNotification &&
					true === module?.active
				);
			}
		),
	},
	[ ENABLE_AUTO_UPDATES_BANNER_SLUG ]: {
		Component: EnableAutoUpdateBannerNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: asyncRequireAll(
			// If the user just set up Site Kit (i.e. just returned from the
			// initial OAuth sign-in flow) and is seeing the dashboard for the
			// first time, we want to hide (dismiss) this notification for 10
			// minutes so they aren't immediately bothered by this CTA.
			async ( registry, viewContext ) => {
				if (
					! ( await requireInitialSetupSuccess()(
						registry,
						viewContext
					) )
				) {
					return true;
				}

				const { select, dispatch } = registry;

				const alreadyDismissed =
					select( CORE_USER ).isDismissingItem(
						ENABLE_AUTO_UPDATES_BANNER_SLUG
					) ||
					select( CORE_NOTIFICATIONS ).isNotificationDismissed(
						ENABLE_AUTO_UPDATES_BANNER_SLUG
					);

				if ( ! alreadyDismissed ) {
					await dispatch( CORE_NOTIFICATIONS ).dismissNotification(
						ENABLE_AUTO_UPDATES_BANNER_SLUG,
						{
							expiresInSeconds: MINUTE_IN_SECONDS * 10,
						}
					);
				}

				return false;
			},
			// Don't render anything if the user has no permission to update plugin,
			// auto-updates can not be enabled for Site Kit, or auto updates are already
			// enabled for Site Kit.
			requireCapability( PERMISSION_UPDATE_PLUGINS ),
			requireCanChangePluginAutoUpdates(),
			asyncRequire( false, requireSiteKitAutoUpdatesEnabled() )
		),
		isDismissible: true,
	},
	'gathering-data-notification': {
		Component: GatheringDataNotification,
		priority: PRIORITY.INFO,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: asyncRequireAny(
			asyncRequireAll(
				requireModuleDataAvailable( MODULE_SLUG_ANALYTICS_4 ),
				requireModuleGatheringData( MODULES_ANALYTICS_4 )
			),
			// Search Console is always connected, so only its view-context
			// visibility is checked here.
			asyncRequireAll(
				requireModuleDataViewable( MODULE_SLUG_SEARCH_CONSOLE ),
				requireModuleGatheringData( MODULES_SEARCH_CONSOLE )
			)
		),
		isDismissible: false,
	},
	'zero-data-notification': {
		Component: ZeroDataNotification,
		priority: PRIORITY.INFO,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: asyncRequireAll(
			// If either of the modules is gathering data, we don't show the notification.
			asyncRequire(
				false,
				asyncRequireAny(
					asyncRequireAll(
						requireModuleDataAvailable( MODULE_SLUG_ANALYTICS_4 ),
						requireModuleGatheringData( MODULES_ANALYTICS_4 )
					),
					asyncRequireAll(
						requireModuleDataAvailable(
							MODULE_SLUG_SEARCH_CONSOLE
						),
						requireModuleGatheringData( MODULES_SEARCH_CONSOLE )
					)
				)
			),
			// If either of the modules is in the zero data state, we need to show the notification.
			asyncRequireAny(
				asyncRequireAll(
					requireModuleDataAvailable( MODULE_SLUG_ANALYTICS_4 ),
					requireModuleZeroData( MODULES_ANALYTICS_4 )
				),
				asyncRequireAll(
					requireModuleDataAvailable( MODULE_SLUG_SEARCH_CONSOLE ),
					requireModuleZeroData( MODULES_SEARCH_CONSOLE )
				)
			)
		),
		isDismissible: true,
	},
	'module-recovery-alert': {
		Component: ModuleRecoveryAlert,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: false,
		checkRequirements: requireHasRecoverableModules(),
	},
	[ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG ]: {
		Component: ConsentModeSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireConsentModeDisabled(),
			requireAdsConnected()
		),
		dismissRetries: 2,
	},
	[ GTG_SETUP_CTA_BANNER_NOTIFICATION ]: {
		Component: GoogleTagGatewaySetupBanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireAnyGoogleTagGatewayModuleConnected(),
			asyncRequire( false, requireGoogleTagGatewayEnabled() ),
			// The health and script access statuses are tri-state: they are
			// `null` until the server requirement status has been fetched, so
			// trigger that fetch and skip the banner for this page load.
			( { select, dispatch } ) => {
				const { isGTGHealthy, isScriptAccessEnabled } =
					select( CORE_SITE );

				if (
					[ isGTGHealthy(), isScriptAccessEnabled() ].includes( null )
				) {
					dispatch( CORE_SITE ).fetchGetGTGServerRequirementStatus();
					return false;
				}

				return true;
			},
			requireGTGHealthy(),
			requireGTGScriptAccessEnabled()
		),
		isDismissible: true,
		featureFlag: 'googleTagGateway',
	},
	[ GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID ]: {
		Component: GoogleTagGatewayWarningNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: asyncRequireAll(
			requireAnyGoogleTagGatewayModuleConnected(),
			requireGoogleTagGatewayEnabled(),
			asyncRequireAny(
				asyncRequire( false, requireGTGHealthy() ),
				asyncRequire( false, requireGTGScriptAccessEnabled() )
			)
		),
		isDismissible: true,
		featureFlag: 'googleTagGateway',
	},
	[ SET_UP_EMAIL_REPORTING_OVERLAY_NOTIFICATION ]: {
		Component: SetUpEmailReportingOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		checkRequirements: asyncRequireAll(
			requireSetupCTAsNotHidden(),
			// Check if email reporting is enabled at site level.
			requireSiteEmailReportingNotDisabled(),
			// The user's own email reporting settings need to have loaded
			// before their subscription status can be trusted.
			async ( { resolveSelect } ) =>
				undefined !==
				( await resolveSelect(
					CORE_USER
				).getEmailReportingSettings() ),
			asyncRequire( false, requireEmailReportingSubscribed() ),
			// For view-only users, check if user has access to at least one
			// of the required email report data modules.
			// Admins always have access to the overlay notification.
			asyncRequireAny(
				asyncRequire( false, requireViewOnlyContext() ),
				requireModuleViewable( MODULE_SLUG_ANALYTICS_4 ),
				requireModuleViewable( MODULE_SLUG_SEARCH_CONSOLE )
			)
		),
	},
	[ PDF_INTRODUCTION_OVERLAY_NOTIFICATION ]: {
		Component: PDFIntroductionOverlayNotification,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		isDismissible: true,
		featureFlag: 'pdfGeneration',
		checkRequirements: requireSetupCTAsNotHidden(),
	},
	[ sharedKeyMetrics.slug ]: {
		Component: createFeatureTourNotification( sharedKeyMetrics ),
		priority: PRIORITY.FEATURE_TOUR,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: sharedKeyMetrics.contexts,
		// `TourTooltips` records the dismissal itself through `dismissTour`, so
		// this stays false to avoid writing a second dismissal record.
		isDismissible: false,
		checkRequirements: async ( { select, resolveSelect } ) => {
			if ( isInitialWelcomeModalActive() ) {
				return false;
			}

			await Promise.all( [
				resolveSelect( CORE_USER ).getDismissedFeatureTourSlugs(),
				resolveSelect( CORE_USER ).getKeyMetrics(),
				resolveSelect( CORE_USER ).getUser(),
				resolveSelect( CORE_SITE ).getSiteInfo(),
			] );

			if (
				select( CORE_USER ).isTourDismissed( sharedKeyMetrics.slug )
			) {
				return false;
			}

			const keyMetrics = select( CORE_USER ).getKeyMetrics();

			if ( ! Array.isArray( keyMetrics ) || keyMetrics.length === 0 ) {
				return false;
			}

			const keyMetricsSetupCompletedBy =
				select( CORE_SITE ).getKeyMetricsSetupCompletedBy();
			const currentUserID = select( CORE_USER ).getID();

			return (
				Number.isInteger( keyMetricsSetupCompletedBy ) &&
				keyMetricsSetupCompletedBy > 0 &&
				Number.isInteger( currentUserID ) &&
				currentUserID !== keyMetricsSetupCompletedBy
			);
		},
	},
	[ WELCOME_MODAL_NOTIFICATION ]: {
		Component: WelcomeModal,
		priority: PRIORITY.SETUP_CTA_WELCOME_MODAL,
		areaSlug: NOTIFICATION_AREAS.OVERLAYS,
		groupID: NOTIFICATION_GROUPS.SETUP_MODALS,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		featureFlag: 'setupFlowRefresh',
		checkRequirements: asyncRequireAll(
			requireAccessToFeatureTour(),
			asyncRequireAny( requireDataGatheringCompleteModalActive(), () =>
				isInitialWelcomeModalActive()
			)
		),
	},
};

/**
 * Registers notifications not specific to any one particular module.
 *
 * @since 1.132.0
 *
 * @param {Object} notificationsAPI Notifications API.
 */
export function registerDefaults( notificationsAPI ) {
	for ( const notificationID in DEFAULT_NOTIFICATIONS ) {
		notificationsAPI.registerNotification(
			notificationID,
			DEFAULT_NOTIFICATIONS[ notificationID ]
		);
	}
}
