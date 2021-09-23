/**
 * Widgets API default contexts
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
 * Internal dependencies
 */
import { isFeatureEnabled } from '../../features';

export const CONTEXT_DASHBOARD = 'dashboard';
export const CONTEXT_PAGE_DASHBOARD = 'pageDashboard';
export const CONTEXT_MODULE_SEARCH_CONSOLE = 'moduleSearchConsole';
export const CONTEXT_MODULE_ANALYTICS = 'moduleAnalytics';
export const CONTEXT_MODULE_ADSENSE = 'moduleAdsense';

export default {
	CONTEXT_DASHBOARD,
	CONTEXT_PAGE_DASHBOARD,
	CONTEXT_MODULE_SEARCH_CONSOLE,
	CONTEXT_MODULE_ANALYTICS,
	CONTEXT_MODULE_ADSENSE,
	...( isFeatureEnabled( 'unifiedDashboard' )
		? {
				// Main dashboard
				CONTEXT_MAIN_DASHBOARD_TRAFFIC: 'mainDashboardTraffic',
				CONTEXT_MAIN_DASHBOARD_CONTENT: 'mainDashboardContent',
				CONTEXT_MAIN_DASHBOARD_SPEED: 'mainDashboardSpeed',
				CONTEXT_MAIN_DASHBOARD_MONETIZATION:
					'mainDashboardMonetization',
				// Entity dashboard
				CONTEXT_ENTITY_DASHBOARD_TRAFFIC: 'entityDashboardTraffic',
				CONTEXT_ENTITY_DASHBOARD_CONTENT: 'entityDashboardContent',
				CONTEXT_ENTITY_DASHBOARD_SPEED: 'entityDashboardSpeed',
				CONTEXT_ENTITY_DASHBOARD_MONETIZATION:
					'entityDashboardMonetization',
		  }
		: {} ),
};
