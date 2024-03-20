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
	provideUserInfo,
} from '../../../../tests/js/utils';
import DashboardSharingSettingsButton from './DashboardSharingSettingsButton';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { MODULES_PAGESPEED_INSIGHTS } from '../../modules/pagespeed-insights/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import {
	sharingSettings,
	modules,
	roles,
} from './DashboardSharingSettings/__fixtures__';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

function Template( { setupRegistry = () => {}, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<DashboardSharingSettingsButton { ...args } />
		</WithRegistrySetup>
	);
}

export const DefaultDashboardSharingSettingsButton = Template.bind( {} );
DefaultDashboardSharingSettingsButton.storyName = 'Default';
DefaultDashboardSharingSettingsButton.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
		} );
	},
};

export const MultipleAdminsDashboardSharingSettingsButton = Template.bind( {} );
MultipleAdminsDashboardSharingSettingsButton.storyName = 'Multiple Admins';
MultipleAdminsDashboardSharingSettingsButton.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_delegate_module_sharing_management::["search-console"]': true,
			'googlesitekit_delegate_module_sharing_management::["pagespeed-insights"]': true,
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
		} );
	},
};

export default {
	title: 'Components/DashboardSharingSettingsButton',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( CORE_MODULES )
					.receiveGetSharingSettings( sharingSettings );
				registry
					.dispatch( CORE_MODULES )
					.receiveShareableRoles( roles );
				registry
					.dispatch( CORE_MODULES )
					.receiveSharedOwnershipModules( [ 'pagespeed-insights' ] );

				provideModules( registry, modules );
				provideModuleRegistrations( registry );
				provideUserInfo( registry );

				registry
					.dispatch( MODULES_PAGESPEED_INSIGHTS )
					.receiveGetSettings( { ownerID: 1 } );
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( { ownerID: 1 } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
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
