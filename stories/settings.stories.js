/**
 * Settings stories.
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
import { Tab, TabBar } from 'googlesitekit-components';
import SettingsModules from '../assets/js/components/settings/SettingsModules';
import Layout from '../assets/js/components/layout/Layout';
import SettingsAdmin from '../assets/js/components/settings/SettingsAdmin';
import { Grid } from '../assets/js/material-components';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
	untilResolved,
} from '../tests/js/utils';
import settingsData from '../.storybook/__fixtures__/_googlesitekitLegacyData';
import { CORE_MODULES } from '../assets/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../assets/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../tests/js/WithRegistrySetup';

/**
 * Add components to the settings page.
 */

function Template() {
	return <SettingsModules />;
}

function TabBarTemplate() {
	return (
		<Layout>
			<TabBar activeIndex={ 0 } handleActiveIndexUpdate={ null }>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Connected Services', 'google-site-kit' ) }
					</span>
				</Tab>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Connect More Services', 'google-site-kit' ) }
					</span>
				</Tab>
				<Tab>
					<span className="mdc-tab__text-label">
						{ __( 'Admin Settings', 'google-site-kit' ) }
					</span>
				</Tab>
			</TabBar>
		</Layout>
	);
}

export const SettingsTabs = TabBarTemplate.bind( {} );
SettingsTabs.storyName = 'Settings Tabs';
SettingsTabs.title = 'Settings/Settings Tabs';
SettingsTabs.scenario = {
	label: 'Settings/SettingsTabs',
	delay: 3000, // Wait for tabs to animate.
};

export const ConnectedServices = Template.bind( {} );
ConnectedServices.storyName = 'Connected Services';
ConnectedServices.scenario = {
	label: 'Settings/ConnectedServices',
};

ConnectedServices.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideModules(
				registry,
				[
					'ads',
					'adsense',
					'analytics-4',
					'pagespeed-insights',
					'search-console',
				].map( ( slug ) => ( {
					slug,
					active: true,
					connected: true,
				} ) )
			);
			provideModuleRegistrations( registry );
		};
		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const ConnectMoreServices = Template.bind( {} );
ConnectMoreServices.storyName = 'Connect More Services';
ConnectMoreServices.scenario = {
	label: 'Settings/ConnectMoreServices',
};

ConnectMoreServices.decorators = [
	( Story ) => {
		const setupRegistry = async ( registry ) => {
			provideModules(
				registry,
				[
					'ads',
					'adsense',
					'pagespeed-insights',
					'search-console',
				].map( ( slug ) => ( {
					slug,
					active: true,
					connected: true,
				} ) )
			);
			provideModuleRegistrations( registry );
			registry.select( CORE_MODULES ).getModule( 'adsense' );
			await untilResolved( registry, CORE_MODULES ).getModules();
		};
		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const AdminSettings = Template.bind( {} );
AdminSettings.storyName = 'Admin Settings';
AdminSettings.scenario = {
	label: 'Settings/AdminSettings',
};

AdminSettings.decorators = [
	() => {
		global._googlesitekitLegacyData = settingsData;

		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry );
			provideModules( registry );

			registry
				.dispatch( CORE_USER )
				.receiveGetTracking( { enabled: false } );
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
	},
];

export default {
	title: 'Settings',
	component: SettingsModules,
};
