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
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../constants';
import { NOTIFICATION_AREAS } from './datastore/constants';
import { CORE_USER } from '../datastore/user/constants';
import { CORE_MODULES } from '../modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';

/**
 * Registers notifications not specific to any one particular module.
 *
 * @since 1.132.0
 *
 * @param {Object} notificationsAPI Notifications API.
 */
export function registerDefaults( notificationsAPI ) {
	notificationsAPI.registerNotification( 'gathering-data-notification', {
		Component() {
			return <h1>TODO: Use a valid notification component here.</h1>;
		},
		priority: 100,
		areaSlug: NOTIFICATION_AREAS.BANNERS_ABOVE_NAV,
		viewContexts: [
			VIEW_CONTEXT_MAIN_DASHBOARD,
			VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		],
		checkRequirements: ( { select } ) => {
			const isAnalyticsConnected =
				select( CORE_MODULES ).isModuleConnected( 'analytics-4' );

			const canViewSharedAnalytics =
				select( CORE_USER ).canViewSharedModule( 'analytics-4' );
			const canViewSharedSearchConsole =
				select( CORE_USER ).canViewSharedModule( 'search-console' );

			const showRecoverableAnalytics = () => {
				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				if ( recoverableModules === undefined ) {
					return undefined;
				}

				return Object.keys( recoverableModules ).includes(
					'analytics-4'
				);
			};
			const showRecoverableSearchConsole = () => {
				const recoverableModules =
					select( CORE_MODULES ).getRecoverableModules();

				if ( recoverableModules === undefined ) {
					return undefined;
				}

				return Object.keys( recoverableModules ).includes(
					'search-console'
				);
			};

			const analyticsGatheringData =
				isAnalyticsConnected &&
				canViewSharedAnalytics &&
				false === showRecoverableAnalytics
					? select( MODULES_ANALYTICS_4 ).isGatheringData()
					: false;
			const searchConsoleGatheringData =
				canViewSharedSearchConsole &&
				false === showRecoverableSearchConsole &&
				select( MODULES_SEARCH_CONSOLE ).isGatheringData();

			if (
				analyticsGatheringData === undefined ||
				searchConsoleGatheringData === undefined
			) {
				return false;
			}

			return analyticsGatheringData || searchConsoleGatheringData;
		},
		isDismissible: true,
	} );
}
