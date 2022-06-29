/**
 * Admin Bar Widgets Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import {
	setupSearchConsoleAnalyticsMockReports,
	setupAnalyticsMockReports,
	setupSearchConsoleMockReports,
	setupSearchConsoleAnalyticsGatheringData,
	setupSearchConsoleAnalyticsZeroData,
	widgetDecorators,
} from './common.stories';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import AdminBarWidgets from './AdminBarWidgets';

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<AdminBarWidgets { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: setupSearchConsoleAnalyticsMockReports,
};

export const GatheringDataLegacy = Template.bind( {} );
GatheringDataLegacy.storyName = 'Gathering Data (Legacy)';

export const AnalyticsGatheringDataLegacy = Template.bind( {} );
AnalyticsGatheringDataLegacy.storyName = 'Gathering Data (Legacy): Analytics';
AnalyticsGatheringDataLegacy.args = {
	setupRegistry: ( registry ) => {
		setupSearchConsoleMockReports( registry );
		setupAnalyticsMockReports( registry, [] );
	},
};

export const AnalyticsInactive = Template.bind( {} );
AnalyticsInactive.storyName = 'Inactive: Analytics';
AnalyticsInactive.args = {
	setupRegistry: ( registry ) => {
		// Set up the search console module store but provide no data.
		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
		] );
		setupSearchConsoleMockReports( registry );
	},
};

export const AnalyticsInactiveNew = Template.bind( {} );
AnalyticsInactiveNew.storyName = 'Inactive: Analytics New CTA';
AnalyticsInactiveNew.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry );
		setupSearchConsoleMockReports( registry );
	},
};

export const AnalyticsInactiveNewCompleteActivation = Template.bind( {} );
AnalyticsInactiveNewCompleteActivation.storyName =
	'Inactive: Analytics New Complete Activation CTA';
AnalyticsInactiveNewCompleteActivation.args = {
	setupRegistry: ( registry ) => {
		// Set up the analytics module store but provide no data.
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
	},
};

export const SearchConsoleGatheringDataLegacy = Template.bind( {} );
SearchConsoleGatheringDataLegacy.storyName =
	'Gathering Data (Legacy): Search Console';
SearchConsoleGatheringDataLegacy.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
		] );
		setupSearchConsoleMockReports( registry, [] );
	},
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: setupSearchConsoleAnalyticsGatheringData,
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupSearchConsoleAnalyticsZeroData,
};

export default {
	title: 'Views/AdminBarApp/AdminBarWidgets',
	decorators: widgetDecorators,
};
