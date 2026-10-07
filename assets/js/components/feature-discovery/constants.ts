/**
 * Feature Discovery constants.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import AllServicesTab from './all-services/AllServicesTab';
import WhatsNewTab from './whats-new/WhatsNewTab';

export const ALL_SERVICES_TAB_PATH = '/all-services';
export const WHATS_NEW_TAB_PATH = '/whats-new';

export const FEATURE_DISCOVERY_TABS = [
	{
		Component: AllServicesTab,
		label: __( 'All services and features', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-all-services-tab-panel',
		path: ALL_SERVICES_TAB_PATH,
		tabID: 'googlesitekit-feature-discovery-all-services-tab',
	},
	{
		Component: WhatsNewTab,
		label: __( 'What’s new?', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-whats-new-tab-panel',
		path: WHATS_NEW_TAB_PATH,
		tabID: 'googlesitekit-feature-discovery-whats-new-tab',
	},
];

export const DEFAULT_TAB_PATH = WHATS_NEW_TAB_PATH;
export const FIRST_VISIT_TAB_PATH = ALL_SERVICES_TAB_PATH;
export const FEATURE_DISCOVERY_VISITED_ITEM_SLUG = 'feature-discovery-visited';
export const HUB_LAUNCH_VERSION = '1.188.0'; // Will be updated in issue #13422

// Maps each module to the one feature whose setup is a plain activation of it,
// so that a module's setup completion can tell whether it was started from the
// hub for that feature. This fixed one-to-one lookup is a deliberate choice: a
// module can back several features (e.g. Analytics also backs Key Metrics), so
// finding the feature by scanning the catalog for the module could match a
// stale record left by a different, abandoned setup and wrongly send the user
// back to the hub. It also keeps `useFinishSetup` free of any need for the
// feature catalog. Features with their own completion handling are covered by
// their own issues.
export const MODULE_SLUG_TO_FEATURE_SLUG: Record< string, string > = {
	[ MODULE_SLUG_ANALYTICS_4 ]: 'analytics',
	[ MODULE_SLUG_ADS ]: 'ads',
	[ MODULE_SLUG_ADSENSE ]: 'adsense',
	[ MODULE_SLUG_PAGESPEED_INSIGHTS ]: 'pagespeed-insights',
	[ MODULE_SLUG_SIGN_IN_WITH_GOOGLE ]: 'sign-in-with-google',
	[ MODULE_SLUG_READER_REVENUE_MANAGER ]: 'reader-revenue-manager',
};
