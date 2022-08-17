/**
 * Thank with Google module initialization.
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
import { SettingsEdit, SettingsView } from './components/settings';
import ThankWithGoogleIcon from '../../../svg/graphics/thank-with-google.svg';
import { MODULES_THANK_WITH_GOOGLE } from './datastore/constants';
import { isFeatureEnabled } from '../../features';

export { registerStore } from './datastore';

const ifTwgIsEnabled = ( func ) => ( ...args ) => {
	if ( isFeatureEnabled( 'twgModule' ) ) {
		func( ...args );
	}
};

export const registerModule = ifTwgIsEnabled( ( modules ) => {
	modules.registerModule( 'thank-with-google', {
		storeName: MODULES_THANK_WITH_GOOGLE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: ThankWithGoogleIcon,
		features: [
			__(
				'Virtual stickers and personal messages from your supporters',
				'google-site-kit'
			),
			__(
				'Revenue from any paid virtual stickers supporters send you',
				'google-site-kit'
			),
		],
	} );
} );
