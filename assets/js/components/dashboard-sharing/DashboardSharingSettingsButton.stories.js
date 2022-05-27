/**
 * DashboardSharingSettingsButton Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteConnection,
} from '../../../../tests/js/utils';
import DashboardSharingSettingsButton from './DashboardSharingSettingsButton';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_PAGESPEED_INSIGHTS } from '../../modules/pagespeed-insights/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';

const settings = {
	'search-console': {
		sharedRoles: [ 'administrator' ],
		management: 'owner',
	},
	analytics: {
		sharedRoles: [ 'editor' ],
		management: 'owner',
	},
	'pagespeed-insights': {
		sharedRoles: [ 'author' ],
		management: 'all_admins',
	},
	adsense: {
		sharedRoles: [],
		management: 'all_admins',
	},
};
const roles = [
	{
		id: 'administrator',
		displayName: 'Administrator',
	},
	{
		id: 'editor',
		displayName: 'Editor',
	},
	{
		id: 'author',
		displayName: 'Author',
	},
	{
		id: 'contributor',
		displayName: 'Contributor',
	},
];

const sharedOwnershipModules = [ 'pagespeed-insights' ];

const modules = [
	{
		slug: 'search-console',
		shareable: true,
		owner: {
			id: 1,
			login: 'Admin 1',
		},
	},
	{
		slug: 'analytics',
		shareable: true,
		owner: {
			id: 1,
			login: 'Admin 1',
		},
	},
	{
		slug: 'pagespeed-insights',
		shareable: true,
		owner: {
			id: 1,
			login: 'Admin 1',
		},
	},

	{
		slug: 'adsense',
		shareable: true,
		owner: {
			id: 2,
			login: 'Admin 2',
		},
	},
];

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<DashboardSharingSettingsButton { ...args } />
	</WithRegistrySetup>
);

export const DefaultDashboardSharingSettingsButton = Template.bind( {} );
DefaultDashboardSharingSettingsButton.storyName = 'Default';
DefaultDashboardSharingSettingsButton.args = {
	setupRegistry: () => {},
};

export const MultipleAdminsDashboardSharingSettingsButton = Template.bind( {} );
MultipleAdminsDashboardSharingSettingsButton.storyName = 'Multiple Admins';
MultipleAdminsDashboardSharingSettingsButton.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );
	},
};

export default {
	title: 'Components/DashboardSharingSettingsButton',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Set global dashboard sharing variables
				global._googlesitekitDashboardSharingData = {
					settings,
					roles,
					sharedOwnershipModules,
				};

				provideModules( registry, modules );
				provideModuleRegistrations( registry );

				registry.dispatch( CORE_USER ).receiveUserInfo( {
					id: 1,
					email: 'admin@example.com',
					name: 'admin',
					picture: 'https://path/to/image',
				} );

				registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.receiveGetSettings( { ownerID: 1 } );
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( { ownerID: 1 } );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetSettings( { ownerID: 1 } );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
