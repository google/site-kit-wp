/**
 * Tag Manager module initialization.
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
import TagManagerIcon from '../../../svg/graphics/tagmanager.svg';
import { MODULES_TAGMANAGER } from './datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'tagmanager', {
		storeName: MODULES_TAGMANAGER,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: TagManagerIcon,
		features: [
			__(
				'You will not be able to create tags without updating code',
				'google-site-kit'
			),
		],
	} );
};
