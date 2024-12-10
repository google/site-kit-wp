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

import {
	SITE_KIT_VIEW_ONLY_CONTEXTS,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SETTINGS,
	VIEW_CONTEXT_SPLASH,
} from '../constants';
import {
	CORE_NOTIFICATIONS,
	NOTIFICATION_AREAS,
	NOTIFICATION_GROUPS,
} from './datastore/constants';
import { CORE_FORMS } from '../datastore/forms/constants';
import { CORE_SITE } from '../datastore/site/constants';
import {
	CORE_USER,
	FORM_TEMPORARY_PERSIST_PERMISSION_ERROR,
} from '../datastore/user/constants';
import { CORE_UI } from '../datastore/ui/constants';
import { CORE_MODULES } from '../modules/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { isZeroReport } from '../../modules/analytics-4/utils';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import UnsatisfiedScopesAlert from '../../components/notifications/UnsatisfiedScopesAlert';
import UnsatisfiedScopesAlertGTE from '../../components/notifications/UnsatisfiedScopesAlertGTE';
import GatheringDataNotification from '../../components/notifications/GatheringDataNotification';
import ZeroDataNotification from '../../components/notifications/ZeroDataNotification';
import GA4AdSenseLinkedNotification from '../../components/notifications/GA4AdSenseLinkedNotification';
import SetupErrorNotification from '../../components/notifications/SetupErrorNotification';
import FirstPartyModeSetupBanner, {
	FPM_SHOW_SETUP_SUCCESS_NOTIFICATION,
} from '../../components/notifications/FirstPartyModeSetupBanner';
import FirstPartyModeSetupSuccessSubtleNotification from '../../components/notifications/FirstPartyModeSetupSuccessSubtleNotification';
import { isFeatureEnabled } from '../../features';
import { FPM_SETUP_CTA_BANNER_NOTIFICATION } from './constants';

export const DEFAULT_NOTIFICATIONS = {
	'authentication-error': {
		Component: UnsatisfiedScopesAlert,
		priority: 150,
		areaSlug: NOTIFICATION_AREAS.ERRORS,
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

			const ga4ModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

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
		priority: 150,
		areaSlug: NOTIFICATION_AREAS.ERRORS,
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

			const ga4ModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

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
		priority: 140,
		areaSlug: NOTIFICATION_AREAS.ERRORS,
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
	'top-earning-pages-success-notification': {
		Component: GA4AdSenseLinkedNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_ENTITY_DASHBOARD,
		],
		checkRequirements: async ( { select, resolveSelect, dispatch } ) => {
			await Promise.all( [
				// The getAdSenseLinked selector relies on the resolution
				// of the getSettings() resolver.
				resolveSelect( MODULES_ANALYTICS_4 ).getSettings(),
				// The isModuleConnected() selector relies on the resolution
				// of the getModules() resolver.
				resolveSelect( CORE_MODULES ).getModules(),
			] );

			const adSenseModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'adsense' );

			const analyticsModuleConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			const isAdSenseLinked =
				select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

			const analyticsAndAdsenseConnectedAndLinked =
				adSenseModuleConnected &&
				analyticsModuleConnected &&
				isAdSenseLinked;

			if ( ! analyticsAndAdsenseConnectedAndLinked ) {
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
			if (
				isZeroReport( report ) === false &&
				analyticsAndAdsenseConnectedAndLinked
			) {
				await dispatch( CORE_NOTIFICATIONS ).dismissNotification(
					'top-earning-pages-success-notification'
				);
				return false;
			}

			return true;
		},
		isDismissible: true,
	},
	'gathering-data-notification': {
		Component: GatheringDataNotification,
		priority: 300,
		areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
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

			const isAnalyticsConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			const canViewSharedAnalytics = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'analytics-4' );

			const canViewSharedSearchConsole = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'search-console' );

			const showRecoverableAnalytics = await ( () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					'analytics-4'
				);
			} )();
			const showRecoverableSearchConsole = await ( () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					'search-console'
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
		priority: 310,
		areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
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
				'analytics-4',
				MODULES_ANALYTICS_4
			);

			const searchConsoleState = await getModuleState(
				'search-console',
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
	[ FPM_SETUP_CTA_BANNER_NOTIFICATION ]: {
		Component: FirstPartyModeSetupBanner,
		priority: 320,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		groupID: NOTIFICATION_GROUPS.SETUP_CTAS,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		checkRequirements: async ( { select, resolveSelect } ) => {
			if ( ! isFeatureEnabled( 'firstPartyMode' ) ) {
				return false;
			}

			const { isModuleConnected } = select( CORE_MODULES );

			if (
				! (
					isModuleConnected( 'analytics-4' ) ||
					isModuleConnected( 'ads' )
				)
			) {
				return false;
			}

			await resolveSelect( CORE_SITE ).getFirstPartyModeSettings();

			const {
				isFirstPartyModeEnabled,
				isFPMHealthy,
				isScriptAccessEnabled,
			} = select( CORE_SITE );

			return (
				! isFirstPartyModeEnabled() &&
				isFPMHealthy() &&
				isScriptAccessEnabled()
			);
		},
		isDismissible: true,
	},
	'setup-success-notification-fpm': {
		Component: FirstPartyModeSetupSuccessSubtleNotification,
		priority: 10,
		areaSlug: NOTIFICATION_AREAS.BANNERS_BELOW_NAV,
		viewContexts: [ VIEW_CONTEXT_MAIN_DASHBOARD ],
		isDismissible: false,
		checkRequirements: ( { select } ) => {
			return !! select( CORE_UI ).getValue(
				FPM_SHOW_SETUP_SUCCESS_NOTIFICATION
			);
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
