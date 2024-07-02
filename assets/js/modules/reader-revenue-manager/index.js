/**
 * Reader Revenue Manager module initialization.
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
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import ReaderRevenueManagerIcon from '../../../svg/graphics/reader-revenue-manager.svg';
import {
	MODULES_READER_REVENUE_MANAGER,
	ERROR_CODE_NON_HTTPS_SITE,
} from './datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { isFeatureEnabled } from '../../features';
import { isURLUsingHTTPS } from './utils/validation';

export { registerStore } from './datastore';

const isRrmModuleEnabled =
	( func ) =>
	( ...args ) => {
		if ( isFeatureEnabled( 'rrmModule' ) ) {
			func( ...args );
		}
	};

export const registerModule = isRrmModuleEnabled( ( modules ) => {
	modules.registerModule( 'reader-revenue-manager', {
		storeName: MODULES_READER_REVENUE_MANAGER,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: ReaderRevenueManagerIcon,
		features: [
			// TODO: Implement the features as part of #8845.
		],
		checkRequirements: async ( registry ) => {
			const homeURL = await registry
				.__experimentalResolveSelect( CORE_SITE )
				.getHomeURL();

			if ( isURLUsingHTTPS( homeURL ) ) {
				return;
			}

			throw {
				code: ERROR_CODE_NON_HTTPS_SITE,
				message: __(
					'The site should use HTTPS to set up Reader Revenue Manager',
					'google-site-kit'
				),
				data: null,
			};
		},
	} );
} );
