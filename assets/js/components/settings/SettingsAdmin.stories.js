/**
 * SettingsAdmin stories.
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
 * Internal dependencies
 */
import SettingsAdmin from './SettingsAdmin';
import { Grid } from './../../../js/material-components';
import {
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
} from './../../../../tests/js/utils';
import settingsData from './../../../../storybook/__fixtures__/_googlesitekitLegacyData';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { CORE_SITE } from './../../googlesitekit/datastore/site/constants';
import { CORE_USER } from './../../googlesitekit/datastore/user/constants';

function Template() {
	global._googlesitekitLegacyData = settingsData;

	const setupRegistry = ( registry ) => {
		provideSiteInfo( registry );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ADS, active: true, connected: true },
		] );

		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );
		registry
			.dispatch( CORE_SITE )
			.receiveGetAdminBarSettings( { enabled: true } );
		registry
			.dispatch( CORE_SITE )
			.receiveGetConsentModeSettings( { enabled: false } );
		registry.dispatch( CORE_SITE ).receiveGetConsentAPIInfo( {
			hasConsentAPI: false,
			wpConsentPlugin: {
				installed: false,
				activateURL:
					'http://example.com/wp-admin/plugins.php?action=activate&plugin=some-plugin',
				installURL:
					'http://example.com/wp-admin/update.php?action=install-plugin&plugin=some-plugin',
			},
		} );
	};

	return (
		<WithTestRegistry callback={ setupRegistry }>
			<Grid>
				<SettingsAdmin />
			</Grid>
		</WithTestRegistry>
	);
}

export const Default = Template.bind( {} );

export default {
	title: 'Components/SettingsAdmin',
	component: SettingsAdmin,
	parameters: { padding: 0 },
};
