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
	provideModuleRegistrations,
	provideUserCapabilities,
} from '../../../../tests/js/utils';

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
Site.scenario = {
	label: 'Global/SetupSuccessBannerNotification/Site',
};

export const Module = Template.bind( {} );
Module.storyName = 'Authentication Success - Generic Module';
Module.parameters = {
	module: { slug: 'tagmanager' },
	query: {
		notification: 'authentication_success',
		slug: 'tagmanager',
	},
};
Module.scenario = {
	label: 'Global/SetupSuccessBannerNotification/Module',
};

export const ModuleWithDescription = Template.bind( {} );
ModuleWithDescription.storyName =
	'Authentication Success - Module with description';
ModuleWithDescription.parameters = {
	module: { slug: 'analytics-4' },
	query: {
		notification: 'authentication_success',
		slug: 'analytics-4',
	},
};
ModuleWithDescription.scenario = {
	label: 'Global/SetupSuccessBannerNotification/ModuleWithDescription',
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
PageSpeedInsights.scenario = {
	label: 'Global/SetupSuccessBannerNotification/PageSpeedInsights',
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
			provideModuleRegistrations( registry );
			provideUserCapabilities( registry );

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
