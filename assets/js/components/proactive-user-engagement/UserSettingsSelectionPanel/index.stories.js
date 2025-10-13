/**
 * UserSettingsSelectionPanel Component Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import {
	provideUserAuthentication,
	provideSiteInfo,
	provideUserInfo,
} from '../../../../../tests/js/utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/proactive-user-engagement/constants';
import { Provider as ViewContextProvider } from '@/js/components/Root/ViewContextContext';
import UserSettingsSelectionPanel from '.';

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<UserSettingsSelectionPanel />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const ViewOnly = Template.bind( {} );
ViewOnly.storyName = 'View-only user';
ViewOnly.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export const Subscribed = Template.bind( {} );
Subscribed.storyName = 'Subscribed';
Subscribed.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_USER )
			.receiveGetProactiveUserEngagementSettings( {
				subscribed: true,
			} );
	},
};

export default {
	title: 'ProactiveUserEngagement/UserSettingsSelectionPanel',
	component: UserSettingsSelectionPanel,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideUserAuthentication( registry );
				provideSiteInfo( registry );
				provideUserInfo( registry, {
					wpEmail: 'someone@anybusiness.com',
				} );

				registry
					.dispatch( CORE_UI )
					.setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
