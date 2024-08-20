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
} from '../constants';
import { NOTIFICATION_AREAS } from './datastore/constants';
import { CORE_USER } from '../datastore/user/constants';
import { CORE_MODULES } from '../modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import GatheringDataNotification from '../../components/notifications/GatheringDataNotification';
import ZeroDataNotification from '../../components/notifications/ZeroDataNotification';

/**
 * Registers notifications not specific to any one particular module.
 *
 * @since 1.132.0
 *
 * @param {Object} notificationsAPI Notifications API.
 */
export function registerDefaults( notificationsAPI ) {
	notificationsAPI.registerNotification( 'gathering-data-notification', {
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

			const isAnalyticsConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			const canViewSharedAnalytics = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'analytics-4' );

			const canViewSharedSearchConsole = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'search-console' );

			const showRecoverableAnalytics = await ( async () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules = await resolveSelect(
					CORE_MODULES
				).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					'analytics-4'
				);
			} )();
			const showRecoverableSearchConsole = await ( async () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules = await resolveSelect(
					CORE_MODULES
				).getRecoverableModules();

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
	} );

	notificationsAPI.registerNotification( 'zero-data-notification', {
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

			const isAnalyticsConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			const canViewSharedAnalytics = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'analytics-4' );

			const canViewSharedSearchConsole = ! viewOnly
				? true
				: select( CORE_USER ).canViewSharedModule( 'search-console' );

			const showRecoverableAnalytics = await ( async () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules = await resolveSelect(
					CORE_MODULES
				).getRecoverableModules();

				return Object.keys( recoverableModules ).includes(
					'analytics-4'
				);
			} )();
			const showRecoverableSearchConsole = await ( async () => {
				if ( ! viewOnly ) {
					return false;
				}

				const recoverableModules = await resolveSelect(
					CORE_MODULES
				).getRecoverableModules();

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

			if ( analyticsGatheringData || searchConsoleGatheringData ) {
				return false;
			}

			const analyticsHasZeroData =
				isAnalyticsConnected &&
				canViewSharedAnalytics &&
				false === showRecoverableAnalytics
					? select( MODULES_ANALYTICS_4 ).hasZeroData()
					: false;

			const searchConsoleHasZeroData =
				canViewSharedSearchConsole &&
				false === showRecoverableSearchConsole &&
				select( MODULES_SEARCH_CONSOLE ).hasZeroData();

			return analyticsHasZeroData || searchConsoleHasZeroData;
		},
		isDismissible: true,
	} );
}
