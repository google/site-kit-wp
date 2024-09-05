/**
 * NoAudienceBannerWidget Component Stories.
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
 * Internal dependencies.
 */
import NoAudienceBannerWidget from '.';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsNoAudienceBanner'
)( NoAudienceBannerWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const AuthenticatedUserWithoutConfigurableAudiencesNeverSetup =
	Template.bind( {} );
AuthenticatedUserWithoutConfigurableAudiencesNeverSetup.storyName =
	'Authenticated user, no selectable audiences, never populated their audience selection';
AuthenticatedUserWithoutConfigurableAudiencesNeverSetup.scenario = {};
AuthenticatedUserWithoutConfigurableAudiencesNeverSetup.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: false,
		} );
	},
};
export const AuthenticatedUserWithoutConfigurableAudiencesHasSetup =
	Template.bind( {} );
AuthenticatedUserWithoutConfigurableAudiencesHasSetup.storyName =
	'Authenticated user, no selectable audiences, previously populated their audience selection';
AuthenticatedUserWithoutConfigurableAudiencesHasSetup.scenario = {};
AuthenticatedUserWithoutConfigurableAudiencesHasSetup.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: true,
		} );
	},
};
export const AuthenticatedUserWithConfigurableAudiences = Template.bind( {} );
AuthenticatedUserWithConfigurableAudiences.storyName =
	'Authenticated user with selectable audiences';
AuthenticatedUserWithConfigurableAudiences.scenario = {};
AuthenticatedUserWithConfigurableAudiences.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: true,
		} );
	},
};

export const ViewOnlyUserWithoutConfigurableAudiencesNeverSetup = Template.bind(
	{}
);
ViewOnlyUserWithoutConfigurableAudiencesNeverSetup.storyName =
	'View only user, no selectable audiences, never populated their audience selection';
ViewOnlyUserWithoutConfigurableAudiencesNeverSetup.scenario = {};
ViewOnlyUserWithoutConfigurableAudiencesNeverSetup.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, { authenticated: false } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
		} );
	},
	isViewOnly: true,
};
export const ViewOnlyUserWithoutConfigurableAudiencesHasSetup = Template.bind(
	{}
);
ViewOnlyUserWithoutConfigurableAudiencesHasSetup.storyName =
	'View only user, no selectable audiences, previously populated their audience selection';
ViewOnlyUserWithoutConfigurableAudiencesHasSetup.scenario = {};
ViewOnlyUserWithoutConfigurableAudiencesHasSetup.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, { authenticated: false } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
		} );
	},
	isViewOnly: true,
};
export const ViewOnlyUserWithConfigurableAudiences = Template.bind( {} );
ViewOnlyUserWithConfigurableAudiences.storyName =
	'View only user with selectable audiences';
ViewOnlyUserWithConfigurableAudiences.scenario = {};
ViewOnlyUserWithConfigurableAudiences.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry, { authenticated: false } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: [],
		} );
	},
	isViewOnly: true,
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/NoAudienceBannerWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = async ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );
				provideModuleRegistrations( registry );

				await args.setupRegistry( registry );
			};

			const viewContext = args.isViewOnly
				? VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				: VIEW_CONTEXT_MAIN_DASHBOARD;

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<ViewContextProvider value={ viewContext }>
						<Story />
					</ViewContextProvider>
				</WithRegistrySetup>
			);
		},
	],
};
