/**
 * Header Component Stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Header from './Header';
import DateRangeSelector from './DateRangeSelector';
import HelpMenu from './help/HelpMenu';
import HelpMenuLink from './help/HelpMenuLink';
import Null from './Null';
import DashboardSharingSettingsButton from './dashboard-sharing/DashboardSharingSettingsButton';
import {
	createTestRegistry,
	WithTestRegistry,
	provideUserAuthentication,
	provideSiteInfo,
	provideModules,
	provideModuleRegistrations,
	provideSiteConnection,
	provideUserCapabilities,
} from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import {
	PERMISSION_AUTHENTICATE,
	PERMISSION_READ_SHARED_MODULE_DATA,
	CORE_USER,
	PERMISSION_VIEW_SHARED_DASHBOARD,
} from '../googlesitekit/datastore/user/constants';
import { Provider as ViewContextProvider } from './Root/ViewContextContext';
import { getMetaCapabilityPropertyName } from '../googlesitekit/datastore/util/permissions';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '../modules/search-console/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../modules/analytics-4/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '../modules/pagespeed-insights/constants';

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<Header { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const PluginHeader = Template.bind( {} );
PluginHeader.storyName = 'Plugin Header';
PluginHeader.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};
PluginHeader.scenario = {
	hierarchyRootSeparator: '|',
	hierarchySeparator: {},
	delay: 3000,
};

export const HeaderWithDateSelector = Template.bind( {} );
HeaderWithDateSelector.storyName = 'Plugin Header with Date Selector';
HeaderWithDateSelector.args = {
	children: <DateRangeSelector />,
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};
HeaderWithDateSelector.scenario = {
	hierarchyRootSeparator: '|',
	hierarchySeparator: {},
	delay: 3000,
};

export const HeaderWithHelpMenu = Template.bind( {} );
HeaderWithHelpMenu.storyName = 'Plugin Header with Help Menu';
HeaderWithHelpMenu.args = {
	children: <HelpMenu />,
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderWithHelpMenuDateRangeSelector = Template.bind( {} );
HeaderWithHelpMenuDateRangeSelector.storyName =
	'Plugin Header with Help Menu and Date Range Selector';
HeaderWithHelpMenuDateRangeSelector.args = {
	children: (
		<Fragment>
			<DateRangeSelector />
			<HelpMenu />
		</Fragment>
	),
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderWithCustomHelpMenuLinks = Template.bind( {} );
HeaderWithCustomHelpMenuLinks.storyName =
	'Plugin Header with custom Help Menu links';
HeaderWithCustomHelpMenuLinks.args = {
	children: (
		<HelpMenu>
			<HelpMenuLink href="#">
				{ __( 'Get help with AdSense', 'google-site-kit' ) }
			</HelpMenuLink>
		</HelpMenu>
	),
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderWithNullSubHeader = Template.bind( {} );
HeaderWithNullSubHeader.storyName = 'Plugin Header with Null Sub Header';
HeaderWithNullSubHeader.args = {
	subHeader: <Null />,
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderWithNavigation = Template.bind( {} );
HeaderWithNavigation.storyName = 'Plugin Header with Dashboard Navigation';
HeaderWithNavigation.args = {
	showNavigation: true,
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderWithDashboardSharingSettings = Template.bind( {} );
HeaderWithDashboardSharingSettings.storyName =
	'Plugin Header with Dashboard Sharing Settings';
HeaderWithDashboardSharingSettings.args = {
	children: (
		<Fragment>
			<DateRangeSelector />
			<DashboardSharingSettingsButton />
			<HelpMenu />
		</Fragment>
	),
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
	},
};

export const HeaderViewOnly = Template.bind( {} );
HeaderViewOnly.storyName = 'Plugin Header in view-only mode';
HeaderViewOnly.args = {
	children: (
		<Fragment>
			<DateRangeSelector />
			<HelpMenu />
		</Fragment>
	),
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				owner: {
					id: '1',
					login: 'Admin 1',
				},
			},
			{
				slug: MODULE_SLUG_PAGESPEED_INSIGHTS,
				owner: {
					id: '2',
					login: 'Admin 2',
				},
			},
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				owner: {
					id: '3',
					login: 'Admin 3',
				},
			},
		] );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: false,
			[ PERMISSION_VIEW_SHARED_DASHBOARD ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_PAGESPEED_INSIGHTS
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetTracking( { enabled: false } );

		// Mock the tracking endpoint to allow checking/unchecking the tracking checkbox.
		fetchMock.post(
			RegExp( 'google-site-kit/v1/core/user/data/tracking' ),
			( url, { body } ) => {
				const { data } = JSON.parse( body );

				return { body: data };
			}
		);
	},
};

export default {
	title: 'Components/Header',
	component: Header,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideSiteInfo( registry );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
	parameters: { padding: 0 },
};
