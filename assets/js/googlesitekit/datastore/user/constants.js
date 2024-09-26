/**
 * `core/user` data store: constants.
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

export const CORE_USER = 'core/user';

export const DISCONNECTED_REASON_CONNECTED_URL_MISMATCH =
	'connected_url_mismatch';

export const GLOBAL_SURVEYS_TIMEOUT_SLUG = '__global';

export const FORM_TEMPORARY_PERSIST_PERMISSION_ERROR =
	'temporary_persist_permission_error';

export const ERROR_CODE_ADBLOCKER_ACTIVE = 'adblocker_active';

// Permissions list.
export const PERMISSION_AUTHENTICATE = 'googlesitekit_authenticate';
export const PERMISSION_SETUP = 'googlesitekit_setup';
export const PERMISSION_VIEW_POSTS_INSIGHTS =
	'googlesitekit_view_posts_insights';
export const PERMISSION_VIEW_DASHBOARD = 'googlesitekit_view_dashboard';
export const PERMISSION_VIEW_SHARED_DASHBOARD =
	'googlesitekit_view_shared_dashboard';
export const PERMISSION_VIEW_MODULE_DETAILS =
	'googlesitekit_view_module_details';
export const PERMISSION_MANAGE_OPTIONS = 'googlesitekit_manage_options';
export const PERMISSION_READ_SHARED_MODULE_DATA =
	'googlesitekit_read_shared_module_data';
export const PERMISSION_MANAGE_MODULE_SHARING_OPTIONS =
	'googlesitekit_manage_module_sharing_options';
export const PERMISSION_DELEGATE_MODULE_SHARING_MANAGEMENT =
	'googlesitekit_delegate_module_sharing_management';
export const PERMISSION_UPDATE_PLUGINS = 'googlesitekit_update_plugins';

// Key Metrics Widgets
export const KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT =
	'kmAnalyticsAdSenseTopEarningContent';
export const KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE =
	'kmAnalyticsEngagedTrafficSource';
export const KM_ANALYTICS_LEAST_ENGAGING_PAGES =
	'kmAnalyticsLeastEngagingPages';
export const KM_ANALYTICS_NEW_VISITORS = 'kmAnalyticsNewVisitors';
export const KM_ANALYTICS_POPULAR_AUTHORS = 'kmAnalyticsPopularAuthors';
export const KM_ANALYTICS_POPULAR_CONTENT = 'kmAnalyticsPopularContent';
export const KM_ANALYTICS_POPULAR_PRODUCTS = 'kmAnalyticsPopularProducts';
export const KM_ANALYTICS_RETURNING_VISITORS = 'kmAnalyticsReturningVisitors';
export const KM_ANALYTICS_TOP_CITIES = 'kmAnalyticsTopCities';
export const KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS =
	'kmAnalyticsTopCitiesDrivingLeads';
export const KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART =
	'kmAnalyticsTopCitiesDrivingAddToCart';
export const KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES =
	'kmAnalyticsTopCitiesDrivingPurchases';
export const KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE =
	'kmAnalyticsTopConvertingTrafficSource';
export const KM_ANALYTICS_TOP_COUNTRIES = 'kmAnalyticsTopCountries';
export const KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES =
	'kmAnalyticsTopRecentTrendingPages';
export const KM_ANALYTICS_TOP_TRAFFIC_SOURCE = 'kmAnalyticsTopTrafficSource';
export const KM_ANALYTICS_PAGES_PER_VISIT = 'kmAnalyticsPagesPerVisit';
export const KM_ANALYTICS_VISIT_LENGTH = 'kmAnalyticsVisitLength';
export const KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES =
	'kmAnalyticsTopReturningVisitorPages';
export const KM_SEARCH_CONSOLE_POPULAR_KEYWORDS =
	'kmSearchConsolePopularKeywords';
export const KM_ANALYTICS_VISITS_PER_VISITOR = 'kmAnalyticsVisitsPerVisitor';
export const KM_ANALYTICS_MOST_ENGAGING_PAGES = 'kmAnalyticsMostEngagingPages';
export const KM_ANALYTICS_TOP_CATEGORIES = 'kmAnalyticsTopCategories';

export const keyMetricsGA4Widgets = [
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LEAST_ENGAGING_PAGES,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_AUTHORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_POPULAR_PRODUCTS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_COUNTRIES,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_PAGES_PER_VISIT,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_VISITS_PER_VISITOR,
	KM_ANALYTICS_MOST_ENGAGING_PAGES,
	KM_ANALYTICS_TOP_CATEGORIES,
];

export const allKeyMetricsTileWidgets = [
	...keyMetricsGA4Widgets,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
];
