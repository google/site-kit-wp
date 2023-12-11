/**
 * `modules/analytics` data store constants.
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

export const MODULES_ANALYTICS = 'modules/analytics';

// A special Account ID value used for the "Set up a new account" option.
export const ACCOUNT_CREATE = 'account_create';
// A special Property ID value used for the "Set up a new property" option.
export const PROPERTY_CREATE = 'property_create';
// A special Profile ID value used for the "Set up a new profile" option.
export const PROFILE_CREATE = 'profile_create';
// Form ID for the account creation form.
export const FORM_ACCOUNT_CREATE = 'analyticsAccountCreate';
// Form ID for the module setup form.
export const FORM_SETUP = 'analyticsSetup';

// OAuth scope required for provisioning a Google Analytics account.
export const PROVISIONING_SCOPE =
	'https://www.googleapis.com/auth/analytics.provision';
export const EDIT_SCOPE = 'https://www.googleapis.com/auth/analytics.edit';

// Date range offset days for Analytics report requests.
export const DATE_RANGE_OFFSET = 1;

export const UI_DIMENSION_NAME = 'dashboardAllTrafficWidgetDimensionName';
export const UI_DIMENSION_COLOR = 'dashboardAllTrafficWidgetDimensionColor';
export const UI_DIMENSION_VALUE = 'dashboardAllTrafficWidgetDimensionValue';
export const UI_ACTIVE_ROW_INDEX = 'dashboardAllTrafficWidgetActiveRowIndex';
export const UI_ALL_TRAFFIC_LOADED = 'dashboardAllTrafficWidgetLoaded';

// Setup modes for Analytics based on UA/GA4 properties.
export const SETUP_FLOW_MODE_UA = 'ua';
export const SETUP_FLOW_MODE_GA4 = 'ga4';

export const PROPERTY_TYPE_UA = 'ua';
export const PROPERTY_TYPE_GA4 = 'ga4';
