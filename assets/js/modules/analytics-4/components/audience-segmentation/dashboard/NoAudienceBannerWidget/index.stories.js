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

const WidgetWithComponentProps = withWidgetComponentProps(
	'analyticsNoAudienceBanner'
)( NoAudienceBannerWidget );

function Template() {
	return <WidgetWithComponentProps />;
}

export const HasConfigurableAudiences = Template.bind( {} );
HasConfigurableAudiences.storyName = 'Has Configurable Audiences';
HasConfigurableAudiences.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/NoAudienceBannerWidget/HasConfigurableAudiences',
};
HasConfigurableAudiences.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );
	},
};

export const NoConfigurableAudience = Template.bind( {} );
NoConfigurableAudience.storyName = 'No Configurable Audience';
NoConfigurableAudience.scenario = {
	label: 'Modules/Analytics4/Components/AudienceSegmentation/Dashboard/NoAudienceBannerWidget/NoConfigurableAudience',
};
NoConfigurableAudience.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setAvailableAudiences( [] );
	},
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

				const audienceSettings = {
					configuredAudiences: [ 'properties/12345/audiences/1' ],
					isAudienceSegmentationWidgetHidden: false,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAudienceSettings( audienceSettings );

				await args?.setupRegistry( registry );
			};
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
