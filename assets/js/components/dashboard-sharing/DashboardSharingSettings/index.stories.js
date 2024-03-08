/**
 * DashboardSharingSettings Component Stories.
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
} from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import DashboardSharingSettings from './index';
import { MODULES_PAGESPEED_INSIGHTS } from '../../../modules/pagespeed-insights/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { Dialog, DialogContent } from '../../../material-components';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { sharingSettings, modules, roles } from './__fixtures__';

function Template( { setupRegistry = () => {}, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<DashboardSharingSettings { ...args } />
		</WithRegistrySetup>
	);
}

export const SingleAdminDefault = Template.bind( {} );
SingleAdminDefault.storyName = 'Single Admin Default';
SingleAdminDefault.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
		} );
	},
};

export const SingleAdminWithOwnedModules = Template.bind( {} );
SingleAdminWithOwnedModules.storyName = 'Single Admin With Owned Modules';
SingleAdminWithOwnedModules.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			...modules,
			{
				slug: 'analytics-4',
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
					id: 1,
					login: 'Admin 1',
				},
			},
		] );

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
			'googlesitekit_manage_module_sharing_options::["adsense"]': true,
			'googlesitekit_manage_module_sharing_options::["pagespeed-insights"]': true,
		} );
	},
};

export const SingleAdminWithNonOwnedModules = Template.bind( {} );
SingleAdminWithNonOwnedModules.storyName =
	'Single Admin With Non-Owned Modules';
SingleAdminWithNonOwnedModules.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			...modules,
			{
				slug: 'search-console',
				shareable: true,
				owner: {
					id: 2,
					login: 'Admin 2',
				},
			},
			{
				slug: 'pagespeed-insights',
				shareable: true,
				owner: {
					id: 2,
					login: 'Admin 2',
				},
			},
		] );
	},
};

export const MultiAdminsDefault = Template.bind( {} );
MultiAdminsDefault.storyName = 'Multi Admins Default';
MultiAdminsDefault.args = {
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

export const MultiAdminsWithOwnedModules = Template.bind( {} );
MultiAdminsWithOwnedModules.storyName = 'Multi Admins With Owned Modules';
MultiAdminsWithOwnedModules.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			...modules,
			{
				slug: 'analytics-4',
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
					id: 1,
					login: 'Admin 1',
				},
			},
		] );

		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_delegate_module_sharing_management::["search-console"]': true,
			'googlesitekit_delegate_module_sharing_management::["analytics-4"]': true,
			'googlesitekit_delegate_module_sharing_management::["adsense"]': true,
			'googlesitekit_delegate_module_sharing_management::["pagespeed-insights"]': true,
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
			'googlesitekit_manage_module_sharing_options::["adsense"]': true,
			'googlesitekit_manage_module_sharing_options::["pagespeed-insights"]': true,
		} );
	},
};

export const MultiAdminsWithNonOwnedModules = Template.bind( {} );
MultiAdminsWithNonOwnedModules.storyName =
	'Multi Admins With Non-Owned Modules';
MultiAdminsWithNonOwnedModules.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			...modules,
			{
				slug: 'search-console',
				shareable: true,
				owner: {
					id: 2,
					login: 'Admin 2',
				},
			},
			{
				slug: 'pagespeed-insights',
				shareable: true,
				owner: {
					id: 2,
					login: 'Admin 2',
				},
			},
		] );

		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );
	},
};

export const MultiAdminsWithSharedOwnershipModules = Template.bind( {} );
MultiAdminsWithSharedOwnershipModules.storyName =
	'Multi Admins With Shared Ownership Modules';
MultiAdminsWithSharedOwnershipModules.args = {
	setupRegistry: ( registry ) => {
		provideSiteConnection( registry, {
			hasMultipleAdmins: true,
		} );

		provideModules( registry, [
			...modules,
			{
				slug: 'analytics-4',
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
					id: 1,
					login: 'Admin 1',
				},
			},
		] );

		registry
			.dispatch( CORE_MODULES )
			.receiveGetSharingSettings( sharingSettings );
		registry.dispatch( CORE_MODULES ).receiveShareableRoles( roles );
		registry
			.dispatch( CORE_MODULES )
			.receiveSharedOwnershipModules( [
				'search-console',
				'analytics-4',
				'adsense',
				'pagespeed-insights',
			] );

		registry.dispatch( CORE_USER ).receiveCapabilities( {
			'googlesitekit_delegate_module_sharing_management::["search-console"]': true,
			'googlesitekit_delegate_module_sharing_management::["analytics-4"]': true,
			'googlesitekit_delegate_module_sharing_management::["adsense"]': true,
			'googlesitekit_delegate_module_sharing_management::["pagespeed-insights"]': true,
			'googlesitekit_manage_module_sharing_options::["search-console"]': true,
			'googlesitekit_manage_module_sharing_options::["analytics-4"]': true,
			'googlesitekit_manage_module_sharing_options::["adsense"]': true,
			'googlesitekit_manage_module_sharing_options::["pagespeed-insights"]': true,
		} );
	},
};

export default {
	title: 'Components/DashboardSharingSettings',
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
					<Dialog
						className="googlesitekit-dialog googlesitekit-sharing-settings-dialog"
						scrimClickAction=""
						escapeKeyAction=""
						open
					>
						<DialogContent className="googlesitekit-dialog__content">
							<Story />
						</DialogContent>
					</Dialog>
				</WithRegistrySetup>
			);
		},
	],
};
