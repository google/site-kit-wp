/**
 * AdSense module initialization.
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
import { SetupMain } from './components/setup';
import {
	SettingsEdit,
	SettingsSetupIncomplete,
	SettingsView,
} from './components/settings';
import AdSenseIcon from '@/svg/graphics/adsense.svg';
import { MODULES_ADSENSE } from './datastore/constants';
import { MODULE_SLUG_ADSENSE } from './constants';
import {
	CORE_USER,
	ERROR_CODE_ADBLOCKER_ACTIVE,
} from '@/js/googlesitekit/datastore/user/constants';
import DashboardMainEffectComponent from './components/DashboardMainEffectComponent';
export { registerStore } from './datastore';
export { registerWidgets } from './widgets';
export { registerNotifications } from './notifications';

export function registerModule( modules ) {
	modules.registerModule( MODULE_SLUG_ADSENSE, {
		storeName: MODULES_ADSENSE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SettingsSetupIncompleteComponent: SettingsSetupIncomplete,
		SetupComponent: SetupMain,
		DashboardMainEffectComponent,
		Icon: AdSenseIcon,
		features: [
			__(
				'Intelligent, automatic ad placement will be disabled',
				'google-site-kit'
			),
			__(
				'You will miss out on revenue from ads placed on your site',
				'google-site-kit'
			),
			__(
				'You will lose access to AdSense insights through Site Kit',
				'google-site-kit'
			),
		],
		checkRequirements: async ( registry ) => {
			const adBlockerActive = await registry
				.resolveSelect( CORE_USER )
				.isAdBlockerActive();

			if ( ! adBlockerActive ) {
				return;
			}

			const message = registry
				.select( MODULES_ADSENSE )
				.getAdBlockerWarningMessage();

			throw {
				code: ERROR_CODE_ADBLOCKER_ACTIVE,
				message,
				data: null,
			};
		},
	} );
}
