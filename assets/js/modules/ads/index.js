/**
 * Ads module initialization.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdsIcon from '../../../svg/graphics/ads.svg';
import { isFeatureEnabled } from '../../features';
import { SettingsEdit, SettingsView } from './components/settings';
import SetupMain from './components/setup/SetupMain';
import { MODULES_ADS } from './datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	if ( isFeatureEnabled( 'adsModule' ) ) {
		modules.registerModule( 'ads', {
			storeName: MODULES_ADS,
			SettingsEditComponent: SettingsEdit,
			SettingsViewComponent: SettingsView,
			SetupComponent: SetupMain,
			Icon: AdsIcon,
			features: [
				__(
					'Tagging necessary for your ads campaigns to work',
					'google-site-kit'
				),
				__(
					'Conversion tracking for your ads campaigns',
					'google-site-kit'
				),
			],
		} );
	}
};
