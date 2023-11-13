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
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
	provideUserCapabilities,
	provideSiteInfo,
} from '../../../../tests/js/utils';
import { widgetDecorators } from './common.stories';
import {
	setupSearchConsoleAnalytics4MockReports,
	setupSearchConsoleAnalytics4GatheringData,
	setupAnalytics4ZeroData,
	provideAnalytics4ReportTitles,
} from './common-GA4.stories';
import FeaturesProvider from '../FeaturesProvider';
import { setupSearchConsoleAnalytics4ZeroData } from '../adminbar/common-GA4.stories';

const Template = ( { setupRegistry, features = [] } ) => {
	const enabledFeatures = new Set( features );

	return (
		<WithRegistrySetup func={ setupRegistry }>
			<FeaturesProvider value={ enabledFeatures }>
				<WPDashboardWidgets />
			</FeaturesProvider>
		</WithRegistrySetup>
	);
};

export const ReadyGA4 = Template.bind( {} );
ReadyGA4.storyName = 'Ready';
ReadyGA4.args = {
	setupRegistry: ( registry ) => {
		provideAnalytics4ReportTitles( registry );
		setupSearchConsoleAnalytics4MockReports( registry );
	},
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
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );
		setupSearchConsoleAnalytics4MockReports( registry );
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
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );
		setupSearchConsoleAnalytics4MockReports( registry );
	},
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
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		setupSearchConsoleAnalytics4MockReports( registry );
	},
};

export const GatheringDataGA4 = Template.bind( {} );
GatheringDataGA4.storyName = 'Gathering Data - GA4';
GatheringDataGA4.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		setupSearchConsoleAnalytics4GatheringData( registry );
	},
};

export const ZeroDataGA4 = Template.bind( {} );
ZeroDataGA4.storyName = 'Zero Data - GA4';
ZeroDataGA4.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		setupSearchConsoleAnalytics4ZeroData( registry );
		setupAnalytics4ZeroData( registry );
	},
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardWidgets',
	decorators: widgetDecorators,
};
