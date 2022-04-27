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
import UserInputSuccessBannerNotification from './notifications/UserInputSuccessBannerNotification';
import Null from './Null';
import DashboardSharingSettingsButton from './dashboard-sharing/DashboardSharingSettingsButton';
import {
	createTestRegistry,
	WithTestRegistry,
	provideUserAuthentication,
	provideSiteInfo,
} from '../../../tests/js/utils';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import { Provider } from './Root/ViewContextContext';
import {
	VIEW_CONTEXT_PAGE_DASHBOARD,
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';

const Template = ( args ) => <Header { ...args } />;

export const PluginHeader = Template.bind( {} );
PluginHeader.storyName = 'Plugin Header';
PluginHeader.scenario = {
	label: 'Global/Plugin Header',
	hierarchyRootSeparator: '|',
	hierarchySeparator: {},
	delay: 3000,
};

export const HeaderWithDateSelector = Template.bind( {} );
HeaderWithDateSelector.storyName = 'Plugin Header with Date Selector';
HeaderWithDateSelector.args = {
	children: <DateRangeSelector />,
};
HeaderWithDateSelector.scenario = {
	label: 'Global/Plugin Header with Date Selector',
	hierarchyRootSeparator: '|',
	hierarchySeparator: {},
	delay: 3000,
};

export const HeaderWithHelpMenu = Template.bind( {} );
HeaderWithHelpMenu.storyName = 'Plugin Header with Help Menu';
HeaderWithHelpMenu.args = {
	children: <HelpMenu />,
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
};

export const HeaderWithSubHeader = Template.bind( {} );
HeaderWithSubHeader.storyName = 'Plugin Header with Sub Header';
HeaderWithSubHeader.args = {
	subHeader: <UserInputSuccessBannerNotification />,
};

export const HeaderWithSubHeaderEntityBanner = Template.bind( {} );
HeaderWithSubHeaderEntityBanner.storyName =
	'Plugin Header with Sub Header and Entity Header Banner';
HeaderWithSubHeaderEntityBanner.args = {
	subHeader: <UserInputSuccessBannerNotification />,
};
HeaderWithSubHeaderEntityBanner.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideSiteInfo( registry, {
				currentEntityTitle:
					'Everything you need to know about driving in Ireland',
				currentEntityURL: 'http://example.com/driving-ireland/',
			} );
		};
		return (
			<Provider value={ VIEW_CONTEXT_PAGE_DASHBOARD }>
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			</Provider>
		);
	},
];

export const HeaderWithNullSubHeader = Template.bind( {} );
HeaderWithNullSubHeader.storyName = 'Plugin Header with Null Sub Header';
HeaderWithNullSubHeader.args = {
	subHeader: <Null />,
};

export const HeaderWithNavigation = Template.bind( {} );
HeaderWithNavigation.storyName = 'Plugin Header with Dashboard Navigation';
HeaderWithNavigation.args = {
	showNavigation: true,
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
};
HeaderWithDashboardSharingSettings.parameters = {
	features: [ 'dashboardSharing' ],
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
};
HeaderViewOnly.decorators = [
	( Story ) => {
		return (
			<Provider value={ VIEW_CONTEXT_DASHBOARD_VIEW_ONLY }>
				<Story />
			</Provider>
		);
	},
];
HeaderViewOnly.parameters = {
	features: [ 'dashboardSharing' ],
};

export default {
	title: 'Components/Header',
	component: Header,
	decorators: [
		( Story, { parameters } ) => {
			const registry = createTestRegistry();
			provideUserAuthentication( registry );
			provideSiteInfo( registry );

			return (
				<WithTestRegistry
					registry={ registry }
					features={ parameters.features || [] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
	parameters: { padding: 0 },
};
