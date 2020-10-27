/**
 * Settings stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsModules from '../assets/js/components/settings/settings-modules';
import Layout from '../assets/js/components/layout/layout';
import { googlesitekit as settingsData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-settings-googlesitekit.js';
import SettingsAdmin from '../assets/js/components/settings/settings-admin';
import { WithTestRegistry } from '../tests/js/utils';

/**
 * Add components to the settings page.
 */
storiesOf( 'Settings', module )
	.add( 'Settings Tabs', () => {
		return (
			<Layout>
				<TabBar
					activeIndex={ 0 }
					handleActiveIndexUpdate={ null }
				>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Connected Services', 'google-site-kit' ) }</span>
					</Tab>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Connect More Services', 'google-site-kit' ) }</span>
					</Tab>
					<Tab>
						<span className="mdc-tab__text-label">{ __( 'Admin Settings', 'google-site-kit' ) }</span>
					</Tab>
				</TabBar>
			</Layout>
		);
	}, {
		options: {
			delay: 3000, // Wait for tabs to animate.
		},
	} )
	.add( 'Connected Services', () => {
		global._googlesitekitLegacyData = settingsData;
		global._googlesitekitLegacyData.setupComplete = true;
		global._googlesitekitLegacyData.modules.analytics.setupComplete = true;
		global._googlesitekitLegacyData.modules[ 'search-console' ].setupComplete = true;
		global._googlesitekitLegacyData.modules.adsense.setupComplete = true;
		global._googlesitekitLegacyData.modules.adsense.active = true;
		global._googlesitekitLegacyData.modules.adsense.settings.accountID = 'pub-XXXXXXXXXXXXXXXX';

		return (
			<WithTestRegistry>
				<div className="mdc-layout-grid__inner">
					<SettingsModules activeTab={ 0 } />
				</div>
			</WithTestRegistry>
		);
	}, {
		options: {
			delay: 100, // Wait for screen to render.
		},
	} )
	.add( 'Connect More Services', () => {
		global._googlesitekitLegacyData = settingsData;
		global._googlesitekitLegacyData.canAdsRun = true;
		global._googlesitekitLegacyData.modules.analytics.setupComplete = false;
		global._googlesitekitLegacyData.modules.adsense.active = false;
		return (
			<WithTestRegistry>
				<SettingsModules activeTab={ 1 } />
			</WithTestRegistry>
		);
	} )
	.add( 'Admin Settings', () => {
		global._googlesitekitLegacyData = settingsData;
		global._googlesitekitLegacyData.modules.analytics.setupComplete = false;
		global._googlesitekitLegacyData.admin.clientID = '123456789-xxx1234ffghrrro6hofusq2b8.apps..com';
		global._googlesitekitLegacyData.admin.clientSecret = '••••••••••••••••••••••••••••';

		return (
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<SettingsAdmin />
				</div>
			</div>
		);
	} );
