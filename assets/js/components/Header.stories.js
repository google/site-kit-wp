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
import {
	createTestRegistry,
	WithTestRegistry,
	provideUserAuthentication,
	provideSiteInfo,
} from '../../../tests/js/utils';

const Template = ( args ) => <Header { ...args } />;

export const PluginHeader = Template.bind( {} );
PluginHeader.storyName = 'Plugin Header';

export const HeaderWithDateSelector = Template.bind( {} );
HeaderWithDateSelector.storyName = 'Plugin Header with Date Selector';
HeaderWithDateSelector.args = {
	children: <DateRangeSelector />,
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

export default {
	title: 'Components/Header',
	component: Header,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideUserAuthentication( registry );
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
