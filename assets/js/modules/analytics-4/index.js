/**
 * Analytics-4 module initialization.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AnalyticsIcon from '@/svg/graphics/analytics.svg';
import { MODULES_ANALYTICS_4 } from './datastore/constants';
import { SettingsEdit, SettingsView } from './components/settings';
import { SetupMain } from './components/setup';
import DashboardMainEffectComponent from './components/DashboardMainEffectComponent';
import { MODULE_SLUG_ANALYTICS_4 } from './constants';

export { registerStore } from './datastore';
export { registerWidgets } from './widgets';
export { registerNotifications } from './notifications';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_ANALYTICS_4, {
		storeName: MODULES_ANALYTICS_4,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		DashboardMainEffectComponent,
		Icon: AnalyticsIcon,
		features: [
			__(
				'Your site will no longer send data to Google Analytics',
				'google-site-kit'
			),
			__(
				'Analytics reports in Site Kit will be disabled',
				'google-site-kit'
			),
		],
	} );
}
