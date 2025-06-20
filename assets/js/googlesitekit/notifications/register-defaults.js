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
import {
	SITE_KIT_VIEW_ONLY_CONTEXTS,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_SPLASH,
} from '../constants';
import { CORE_NOTIFICATIONS } from './datastore/constants';
import {
	NOTIFICATION_GROUPS,
	NOTIFICATION_AREAS,
	FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
	FPM_SETUP_CTA_BANNER_NOTIFICATION,
	PRIORITY,
} from './constants';
import { CORE_FORMS } from '../datastore/forms/constants';
import { CORE_SITE } from '../datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
	PERMISSION_UPDATE_PLUGINS,
} from '../datastore/user/constants';
import { CORE_MODULES } from '../modules/datastore/constants';
import { MODULES_ADSENSE } from '../../modules/adsense/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../modules/analytics-4/constants';
import { isZeroReport } from '../../modules/analytics-4/utils';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '../../modules/search-console/constants';
import { MODULE_SLUG_ADSENSE } from '../../modules/adsense/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import AuthError from '../../components/notifications/AuthError';
import UnsatisfiedScopesAlert from '../../components/notifications/UnsatisfiedScopesAlert';
import UnsatisfiedScopesAlertGTE from '../../components/notifications/UnsatisfiedScopesAlertGTE';
import GatheringDataNotification from '../../components/notifications/GatheringDataNotification';
import ZeroDataNotification from '../../components/notifications/ZeroDataNotification';
import GA4AdSenseLinkedNotification from '../../components/notifications/GA4AdSenseLinkedNotification';
import SetupErrorNotification from '../../components/notifications/SetupErrorNotification';
import SetupErrorMessageNotification from '../../components/notifications/SetupErrorMessageNotification';
import FirstPartyModeWarningNotification from '../../components/notifications/FirstPartyModeWarningNotification';
import FirstPartyModeSetupBanner from '../../components/notifications/FirstPartyModeSetupBanner';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from '../../components/consent-mode/constants';
import ConsentModeSetupCTABanner from '../../components/consent-mode/ConsentModeSetupCTABanner';
import EnableAutoUpdateBannerNotification, {
	ENABLE_AUTO_UPDATES_BANNER_SLUG,
} from '../../components/notifications/EnableAutoUpdateBannerNotification';
import { MINUTE_IN_SECONDS } from '../../util';
import ModuleRecoveryAlert from '../../components/dashboard-sharing/ModuleRecoveryAlert';
import SiteKitSetupSuccessNotification from '../../components/notifications/SiteKitSetupSuccessNotification';
import ModuleSetupSuccessNotification from '../../components/notifications/ModuleSetupSuccessNotification';
import AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification, {
	ANALYTICS_ADSENSE_LINKED_OVERLAY_NOTIFICATION,
} from '../../components/OverlayNotification/AnalyticsAndAdSenseAccountsDetectedAsLinkedOverlayNotification';
import LinkAnalyticsAndAdSenseAccountsOverlayNotification, {
	LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
} from '../../components/OverlayNotification/LinkAnalyticsAndAdSenseAccountsOverlayNotification';

export const DEFAULT_NOTIFICATIONS = {
	'authentication-error': {
		Component: UnsatisfiedScopesAlert,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The getSetupErrorMessage selector relies on the resolution
				// of the getSiteInfo() resolver.
				resolveSelect( CORE_SITE ).getSiteInfo(),
				// The isAuthenticated(), hasScope() and getUnsatisfiedScopes() selectors
				// rely on the resolution of getAuthentication().
				resolveSelect( CORE_USER ).getAuthentication(),
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const setupErrorMessage =
				select( CORE_SITE ).getSetupErrorMessage();

			const isAuthenticated = select( CORE_USER ).isAuthenticated();

			const ga4ModuleConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			const hasTagManagerReadScope = select( CORE_USER ).hasScope(
				TAGMANAGER_READ_SCOPE
			);

			const unsatisfiedScopes =
				select( CORE_USER ).getUnsatisfiedScopes();

			const showUnsatisfiedScopesAlertGTE =
				ga4ModuleConnected &&
				! hasTagManagerReadScope &&
				unsatisfiedScopes?.length === 1;

			return (
				unsatisfiedScopes?.length &&
				! setupErrorMessage &&
				isAuthenticated &&
				! showUnsatisfiedScopesAlertGTE
			);
		},
		isDismissible: false,
	},
	'authentication-error-gte': {
		Component: UnsatisfiedScopesAlertGTE,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The getSetupErrorMessage selector relies on the resolution
				// of the getSiteInfo() resolver.
				resolveSelect( CORE_SITE ).getSiteInfo(),
				// The isAuthenticated() and hasScope() selectors
				// rely on the resolution of getAuthentication().
				resolveSelect( CORE_USER ).getAuthentication(),
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const setupErrorMessage =
				select( CORE_SITE ).getSetupErrorMessage();

			const isAuthenticated = select( CORE_USER ).isAuthenticated();

			const ga4ModuleConnected = select( CORE_MODULES ).isModuleConnected(
				MODULE_SLUG_ANALYTICS_4
			);

			const hasTagManagerReadScope = select( CORE_USER ).hasScope(
				TAGMANAGER_READ_SCOPE
			);

			const showUnsatisfiedScopesAlertGTE =
				ga4ModuleConnected && ! hasTagManagerReadScope;

			return (
				! setupErrorMessage &&
				isAuthenticated &&
				showUnsatisfiedScopesAlertGTE
			);
		},
		isDismissible: false,
	},
	setup_error: {
		Component: SetupErrorNotification,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_SPLASH ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			// The getSetupErrorMessage selector relies on the resolution
			// of the getSiteInfo() resolver.
			await resolveSelect( CORE_SITE ).getSiteInfo();

			const setupErrorMessage =
				select( CORE_SITE ).getSetupErrorMessage();

			const { data: permissionsErrorData } =
				select( CORE_FORMS ).getValue(
					FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
					'permissionsError'
				) || {};

			// If there's no setup error message or the temporary persisted permissions error has skipDefaultErrorNotifications flag set, return false.
			if (
				! setupErrorMessage ||
				permissionsErrorData?.skipDefaultErrorNotifications
			) {
				return false;
			}

			return true;
		},
		isDismissible: false,
	},
	setup_plugin_error: {
		Component: SetupErrorMessageNotification,
		priority: PRIORITY.ERROR_HIGH,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
			VIEW_CONTEXT_SETTINGS,
		],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await resolveSelect( CORE_SITE ).getSiteInfo();

			const temporaryPersistedPermissionsError = select(
				CORE_FORMS
			).getValue(
				FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
				'permissionsError'
			);

			if (
				temporaryPersistedPermissionsError?.data
					?.skipDefaultErrorNotifications
			) {
				return false;
			}

			const setupErrorMessage =
				select( CORE_SITE ).getSetupErrorMessage();

			return !! setupErrorMessage;
		},
		isDismissible: false,
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
		checkRequirements: ( { select } ) => {
			const error = select( CORE_USER ).getAuthError();

			return !! error;
		},
		isDismissible: false,
	},
	'top-earning-pages-success-notification': {
		Component: GA4AdSenseLinkedNotification,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
		],
		checkRequirements: async ( { select, resolveSelect, dispatch } ) => {
			const adSenseModuleConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ADSENSE );

			const analyticsModuleConnected = await resolveSelect(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

			if ( ! ( adSenseModuleConnected && analyticsModuleConnected ) ) {
				return false;
			}

			await resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

			const isAdSenseLinked =
				select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

			if ( ! isAdSenseLinked ) {
				return false;
			}

			const { startDate, endDate } = select(
				CORE_USER
			).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
			} );

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
			};

			// Ensure resolution of the report has completed before showing this
			// notification, since it should only appear when the user has no data in
			// the report.
			const report = await resolveSelect( MODULES_ANALYTICS_4 ).getReport(
				reportOptions
			);

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
		},
		isDismissible: true,
	},
	'setup-success-notification-site-kit': {
		Component: SiteKitSetupSuccessNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: () => {
			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			if ( 'authentication_success' === notification && ! slug ) {
				return true;
			}

			return false;
		},
	},
	'setup-success-notification-module': {
		Component: ModuleSetupSuccessNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			await Promise.all( [
				// The getModule() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );
			const module = select( CORE_MODULES ).getModule( slug );

			if (
				'authentication_success' === notification &&
				false === module.overrideSetupSuccessNotification &&
				module.active
			) {
				return true;
			}

			return false;
		},
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
		checkRequirements: async ( { select, resolveSelect, dispatch } ) => {
			await Promise.all( [
				// The hasCapability() selector relies on the resolution
				// of the getCapabilities() resolver.
				resolveSelect( CORE_USER ).getCapabilities(),
				// The hasChangePluginAutoUpdatesCapacity() and
				// getSiteKitAutoUpdatesEnabled() selectors rely on the
				// resolution of the getSiteInfo() resolver.
				resolveSelect( CORE_SITE ).getSiteInfo(),
			] );

			const notification = getQueryArg( location.href, 'notification' );
			const slug = getQueryArg( location.href, 'slug' );

			const { dismissNotification } = dispatch( CORE_NOTIFICATIONS );

			/**
			 * If the user just set up Site Kit (i.e. just returned from the
			 * initial OAuth sign-in flow) and is seeing the dashboard
			 * for the first time, we want to hide (dismiss) this notification for 10
			 * minutes so they aren't immediately bothered by this CTA.
			 */
			if ( notification === 'authentication_success' && ! slug ) {
				await dismissNotification( 'auto-update-cta', {
					expiresInSeconds: MINUTE_IN_SECONDS * 10,
				} );
				return false;
			}

			const hasUpdatePluginCapability = select( CORE_USER ).hasCapability(
				PERMISSION_UPDATE_PLUGINS
			);
			const hasChangePluginAutoUpdatesCapacity =
				select( CORE_SITE ).hasChangePluginAutoUpdatesCapacity();
			const siteKitAutoUpdatesEnabled =
				select( CORE_SITE ).getSiteKitAutoUpdatesEnabled();

			// Don't render anything if the user has no permission to update plugin,
			// auto-updates can not be enabled for Site Kit, or auto updates are already
			// enabled for Site Kit.
			if (
				hasUpdatePluginCapability &&
				hasChangePluginAutoUpdatesCapacity &&
				! siteKitAutoUpdatesEnabled
			) {
				return true;
			}

			return false;
		},
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
		checkRequirements: async ( { select, resolveSelect }, viewContext ) => {
			const viewOnly =
				SITE_KIT_VIEW_ONLY_CONTEXTS.includes( viewContext );

			await Promise.all( [
				// The isModuleConnected() and canViewSharedModule() selectors rely
				// on the resolution of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				viewOnly
					? resolveSelect( CORE_MODULES ).getRecoverableModules()
					: Promise.resolve( [] ),
			] );

			const isAnalyticsConnected = select(
				CORE_MODULES
			).isModuleConnected( MODULE_SLUG_ANALYTICS_4 );

			const canViewSharedAnalytics = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule(
						MODULE_SLUG_ANALYTICS_4
				  );

			const canViewSharedSearchConsole = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule(
						MODULE_SLUG_SEARCH_CONSOLE
				  );

			const showRecoverableAnalytics = await ( () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					MODULE_SLUG_ANALYTICS_4
				);
			} )();
			const showRecoverableSearchConsole = await ( () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					MODULE_SLUG_SEARCH_CONSOLE
				);
			} )();

			const analyticsGatheringData =
				isAnalyticsConnected &&
				canViewSharedAnalytics &&
				false === showRecoverableAnalytics
					? await resolveSelect(
							MODULES_ANALYTICS_4
					  ).isGatheringData()
					: false;
			const searchConsoleGatheringData =
				canViewSharedSearchConsole &&
				false === showRecoverableSearchConsole &&
				( await resolveSelect(
					MODULES_SEARCH_CONSOLE
				).isGatheringData() );

			return analyticsGatheringData || searchConsoleGatheringData;
		},
		isDismissible: true,
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
		checkRequirements: async ( { select, resolveSelect }, viewContext ) => {
			const viewOnly =
				SITE_KIT_VIEW_ONLY_CONTEXTS.includes( viewContext );

			await Promise.all( [
				// The isModuleConnected() and canViewSharedModule() selectors rely
				// on the resolution of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
				viewOnly
					? resolveSelect( CORE_MODULES ).getRecoverableModules()
					: Promise.resolve( [] ),
			] );

			const getModuleState = async ( moduleSlug, datastoreSlug ) => {
				// Check if the module connected and return early if not.
				const isConnected =
					select( CORE_MODULES ).isModuleConnected( moduleSlug );
				if ( ! isConnected ) {
					return 'disconnected';
				}

				// If we are in the view only mode, we need to ensure the user can view the module
				// and it is not in the recovering state. Return early if either of these is wrong.
				if ( viewOnly ) {
					const canView =
						select( CORE_USER ).canViewSharedModule( moduleSlug );
					if ( ! canView ) {
						return 'cant-view';
					}

					const modules =
						select( CORE_MODULES ).getRecoverableModules();
					if ( !! modules[ moduleSlug ] ) {
						return 'recovering';
					}
				}

				// Next, we need to check gathering data state and return early
				// if the module is in the gathering state.
				const isGatheringData = await resolveSelect(
					datastoreSlug
				).isGatheringData();
				if ( isGatheringData ) {
					return 'gathering';
				}

				// Finally, we need to preload the sample report and check if it has zero data.
				await resolveSelect( datastoreSlug ).getReport(
					select( datastoreSlug ).getSampleReportArgs()
				);

				if ( select( datastoreSlug ).hasZeroData() ) {
					return 'zero-data';
				}

				return 'connected';
			};

			// Get Analytics-4 and Search Console states.
			const analyticsState = await getModuleState(
				MODULE_SLUG_ANALYTICS_4,
				MODULES_ANALYTICS_4
			);

			const searchConsoleState = await getModuleState(
				MODULE_SLUG_SEARCH_CONSOLE,
				MODULES_SEARCH_CONSOLE
			);

			// If either of the modules is gathering data, we don't show the notification.
			if (
				analyticsState === 'gathering' ||
				searchConsoleState === 'gathering'
			) {
				return false;
			}

			// If either of the modules is in the zero data state, we need to show the notification.
			return (
				analyticsState === 'zero-data' ||
				searchConsoleState === 'zero-data'
			);
		},
		isDismissible: true,
	},
	'module-recovery-alert': {
		Component: ModuleRecoveryAlert,
		priority: PRIORITY.ERROR_LOW,
		areaSlug: NOTIFICATION_AREAS.HEADER,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: false,
		checkRequirements: async ( { resolveSelect } ) => {
			const recoverableModules = await resolveSelect(
				CORE_MODULES
			).getRecoverableModules();
			const recoverableModulesList = Object.keys(
				recoverableModules || {}
			);
			if ( ! recoverableModulesList.length ) {
				return false;
			}
			return true;
		},
	},
	[ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG ]: {
		Component: ConsentModeSetupCTABanner,
		priority: PRIORITY.SETUP_CTA_HIGH,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: true,
		checkRequirements: async ( { select, resolveSelect } ) => {
			// The isConsentModeEnabled selector relies on the resolution
			// of the getConsentModeSettings() resolver.
			await resolveSelect( CORE_SITE ).getConsentModeSettings();

			const isConsentModeEnabled =
				select( CORE_SITE ).isConsentModeEnabled();

			if ( isConsentModeEnabled !== false ) {
				return false;
			}

			return resolveSelect( CORE_SITE ).isAdsConnected();
		},
		dismissRetries: 2,
	},
	[ FPM_SETUP_CTA_BANNER_NOTIFICATION ]: {
		Component: FirstPartyModeSetupBanner,
		priority: PRIORITY.SETUP_CTA_LOW,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect, dispatch } ) => {
			const isFPMModuleConnected =
				select( CORE_SITE ).isAnyFirstPartyModeModuleConnected();

			if ( ! isFPMModuleConnected ) {
				return false;
			}

			await resolveSelect( CORE_SITE ).getFirstPartyModeSettings();

			const {
				isFirstPartyModeEnabled,
				isFPMHealthy,
				isScriptAccessEnabled,
			} = select( CORE_SITE );

			if ( isFirstPartyModeEnabled() ) {
				return false;
			}

			const isHealthy = isFPMHealthy();
			const isAccessEnabled = isScriptAccessEnabled();

			if ( [ isHealthy, isAccessEnabled ].includes( null ) ) {
				dispatch( CORE_SITE ).fetchGetFPMServerRequirementStatus();
				return false;
			}

			return isHealthy && isAccessEnabled;
		},
		isDismissible: true,
		featureFlag: 'firstPartyMode',
	},
	[ FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID ]: {
		Component: FirstPartyModeWarningNotification,
		areaSlug: NOTIFICATION_AREAS.DASHBOARD_TOP,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			const isFPMModuleConnected =
				select( CORE_SITE ).isAnyFirstPartyModeModuleConnected();

			if ( ! isFPMModuleConnected ) {
				return false;
			}

			await resolveSelect( CORE_SITE ).getFirstPartyModeSettings();

			const {
				isFirstPartyModeEnabled,
				isFPMHealthy,
				isScriptAccessEnabled,
			} = select( CORE_SITE );

			return (
				isFirstPartyModeEnabled() &&
				( ! isFPMHealthy() || ! isScriptAccessEnabled() )
			);
		},
		isDismissible: true,
		featureFlag: 'firstPartyMode',
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
