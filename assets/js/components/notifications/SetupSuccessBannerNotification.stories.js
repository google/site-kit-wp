/**
 * SetupSuccessBannerNotification Component Stories.
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
 * External dependencies
 */
import { withQuery } from '@storybook/addon-queryparams';

/**
 * Internal dependencies
 */
import SetupSuccessBannerNotification from './SetupSuccessBannerNotification';
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
} from '../../../../tests/js/utils';

function createServiceSetupV2Variant( Story ) {
	const StoryV2 = ( ...args ) => Story( ...args );

	return Object.assign( StoryV2, Story, {
		storyName: Story.storyName + ' - Service Setup V2',
		parameters: {
			...Story.parameters,
			features: [ 'serviceSetupV2' ],
		},
	} );
}

function Template( { ...args } ) {
	return <SetupSuccessBannerNotification { ...args } />;
}

export const Site = Template.bind( {} );
Site.storyName = 'Authentication Success - Site';
Site.parameters = {
	query: {
		notification: 'authentication_success',
		slug: undefined,
	},
};

export const Module = Template.bind( {} );
Module.storyName = 'Authentication Success - Generic Module';
Module.parameters = {
	query: {
		notification: 'authentication_success',
		slug: 'analytics',
	},
};

export const PageSpeedInsights = Template.bind( {} );
PageSpeedInsights.storyName = 'Authentication Success - Page Speed Insights';
PageSpeedInsights.parameters = {
	module: { slug: 'pagespeed-insights' },
	query: {
		notification: 'authentication_success',
		slug: 'pagespeed-insights',
	},
};

export const IdeaHub = Template.bind( {} );
IdeaHub.storyName = 'Authentication Success - Idea Hub';
IdeaHub.parameters = {
	module: { slug: 'idea-hub', name: 'Idea Hub' },
	query: {
		notification: 'authentication_success',
		slug: 'idea-hub',
	},
};

export const SiteV2 = createServiceSetupV2Variant( Site );
export const ModuleV2 = createServiceSetupV2Variant( Module );
export const PageSpeedInsightsV2 = createServiceSetupV2Variant(
	PageSpeedInsights
);
export const IdeaHubV2 = createServiceSetupV2Variant( IdeaHub );

export const UserInputSuccess = Template.bind( {} );
UserInputSuccess.storyName = 'User Input Success';
UserInputSuccess.parameters = {
	query: {
		notification: 'user_input_success',
	},
};

export default {
	title: 'Components/SetupSuccessBannerNotification',
	component: SetupSuccessBannerNotification,
	decorators: [
		withQuery,
		( Story, { parameters } ) => {
			const registry = createTestRegistry();

			provideModules( registry, [
				{
					...( parameters.module || { slug: 'analytics' } ),
					active: true,
					connected: true,
				},
			] );

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
};
