/**
 * Audience Selection Panel Component Stories.
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
 * Internal dependencies
 */
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from './constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import { Provider as ViewContextProvider } from '../../../../../../components/Root/ViewContextContext';
import WithRegistrySetup from '../../../../../../../../tests/js/WithRegistrySetup';
import { availableAudiences } from './../../../../datastore/__fixtures__';
import { provideAnalytics4MockReport } from '../../../../utils/data-mock';
import { provideUserAuthentication } from '../../../../../../../../tests/js/utils';
import AudienceSelectionPanel from '.';

function Template( { viewContext } ) {
	return (
		<ViewContextProvider
			value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
		>
			<AudienceSelectionPanel />
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/Default',
};

export const ViewOnlyUser = Template.bind( {} );
ViewOnlyUser.storyName = 'View-only user';
ViewOnlyUser.args = {
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};
ViewOnlyUser.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/ViewOnlyUser',
};

export const WithSavedItems = Template.bind( {} );
WithSavedItems.storyName = 'WithSavedItems';
WithSavedItems.args = {
	configuredAudiences: [
		'properties/12345/audiences/3',
		'properties/12345/audiences/4',
	],
};
WithSavedItems.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel/WithSavedItems',
};

export default {
	title: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/AudienceSelectionPanel',
	component: AudienceSelectionPanel,
	decorators: [
		( Story, { args: { configuredAudiences = [] } } ) => {
			const reportOptions = {
				endDate: '2024-03-27',
				startDate: '2024-02-29',
				dimensions: [ { name: 'audienceResourceName' } ],
				dimensionFilters: {
					audienceResourceName: availableAudiences
						.filter(
							( { audienceSlug } ) =>
								'purchasers' !== audienceSlug
						)
						.map( ( { name } ) => name ),
				},
				metrics: [ { name: 'totalUsers' } ],
			};

			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( availableAudiences );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setConfiguredAudiences( configuredAudiences );

				provideAnalytics4MockReport( registry, reportOptions );

				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
