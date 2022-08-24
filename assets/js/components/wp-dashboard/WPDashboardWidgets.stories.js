/**
 * WP Dashboard Widgets Component Stories.
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
import WPDashboardWidgets from './WPDashboardWidgets';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import {
	setupSearchConsoleAnalyticsMockReports,
	setupSearchConsoleMockReports,
	setupSearchConsoleAnalyticsZeroData,
	setupSearchConsoleAnalyticsGatheringData,
	widgetDecorators,
} from './common.stories';

const Template = ( { setupRegistry } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WPDashboardWidgets />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: setupSearchConsoleAnalyticsMockReports,
};

export const ReadyWithActivateModuleCTA = Template.bind( {} );
ReadyWithActivateModuleCTA.storyName = 'Ready with Activate Module CTA';
ReadyWithActivateModuleCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );
		setupSearchConsoleMockReports( registry );
	},
};

export const ReadyWithActivateAnalyticsCTA = Template.bind( {} );
ReadyWithActivateAnalyticsCTA.storyName = 'Ready with Activate Analytics CTA';
ReadyWithActivateAnalyticsCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );
		setupSearchConsoleMockReports( registry );
	},
};
ReadyWithActivateAnalyticsCTA.parameters = {
	features: [ 'zeroDataStates' ],
};
ReadyWithActivateAnalyticsCTA.scenario = {
	label: 'Views/WPDashboardApp/WPDashboardWidgets/ReadyWithActivateAnalyticsCTA',
	delay: 3000,
};

export const ReadyWithCompleteAnalyticsActivationCTA = Template.bind( {} );
ReadyWithCompleteAnalyticsActivationCTA.storyName =
	'Ready with Complete Analytics Activation CTA';
ReadyWithCompleteAnalyticsActivationCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: false,
				slug: 'analytics',
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
	},
};
ReadyWithCompleteAnalyticsActivationCTA.parameters = {
	features: [ 'zeroDataStates' ],
};

export const GatheringData = Template.bind( {} );
GatheringData.storyName = 'Gathering Data';
GatheringData.args = {
	setupRegistry: setupSearchConsoleAnalyticsGatheringData,
};
GatheringData.parameters = {
	features: [ 'zeroDataStates' ],
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: setupSearchConsoleAnalyticsZeroData,
};
ZeroData.parameters = {
	features: [ 'zeroDataStates' ],
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardWidgets',
	decorators: widgetDecorators,
};
