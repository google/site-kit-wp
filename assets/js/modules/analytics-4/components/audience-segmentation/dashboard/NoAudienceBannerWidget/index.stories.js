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

export const AuthenticatedUserNeverSetup = Template.bind( {} );
AuthenticatedUserNeverSetup.storyName =
	'Authenticated user, never populated their audience selection';
AuthenticatedUserNeverSetup.scenario = {};
AuthenticatedUserNeverSetup.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: false,
		} );
	},
};

export const AuthenticatedUserHasSetup = Template.bind( {} );
AuthenticatedUserHasSetup.storyName =
	'Authenticated user, previously populated their audience selection';
AuthenticatedUserHasSetup.scenario = {};
AuthenticatedUserHasSetup.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: true,
		} );
	},
};

export const ViewOnlyUserNeverSetup = Template.bind( {} );
ViewOnlyUserNeverSetup.storyName =
	'View-only user, never populated their audience selection';
ViewOnlyUserNeverSetup.scenario = {};
ViewOnlyUserNeverSetup.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: false,
		} );
	},
	isViewOnly: true,
};

export const ViewOnlyUserHasSetup = Template.bind( {} );
ViewOnlyUserHasSetup.storyName =
	'View-only user, previously populated their audience selection';
ViewOnlyUserHasSetup.scenario = {};
ViewOnlyUserHasSetup.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [],
			didSetAudiences: true,
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

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

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
