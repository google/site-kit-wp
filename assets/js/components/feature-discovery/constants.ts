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
import AllServicesTab from './all-services/AllServicesTab';
import WhatsNewTab from './whats-new/WhatsNewTab';

export const FEATURE_DISCOVERY_TABS = [
	{
		Component: AllServicesTab,
		label: __( 'All services and features', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-all-services-tab-panel',
		path: '/all-services',
		tabID: 'googlesitekit-feature-discovery-all-services-tab',
	},
	{
		Component: WhatsNewTab,
		label: __( 'What’s new?', 'google-site-kit' ),
		panelID: 'googlesitekit-feature-discovery-whats-new-tab-panel',
		path: '/whats-new',
		tabID: 'googlesitekit-feature-discovery-whats-new-tab',
	},
];

export const DEFAULT_TAB_PATH = '/whats-new';
