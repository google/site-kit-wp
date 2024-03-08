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
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	provideModules,
	provideModuleRegistrations,
	provideUserAuthentication,
	provideUserCapabilities,
	provideSiteInfo,
} from '../../../../tests/js/utils';
import {
	setupAnalytics4ZeroData,
	setupSearchConsoleZeroData,
	provideAnalytics4ReportTitles,
	setupSearchConsoleMockReports,
	setupAnalytics4MockReports,
	setupSearchConsoleGatheringData,
	setupAnalytics4GatheringData,
	widgetDecorators,
} from './common-GA4.stories';
import { VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY } from '../../googlesitekit/constants';

function Template( { setupRegistry, viewContext } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ viewContext }>
				<WPDashboardWidgets />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const ReadyGA4 = Template.bind( {} );
ReadyGA4.storyName = 'Ready';
ReadyGA4.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		provideAnalytics4ReportTitles( registry );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
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
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );
		setupSearchConsoleMockReports( registry );
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
				slug: 'analytics-4',
			},
		] );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
};

export const ViewOnlyAnalyticsAndSearchConsole = Template.bind( {} );
ViewOnlyAnalyticsAndSearchConsole.storyName =
	'View Only Analytics And Search Console';
ViewOnlyAnalyticsAndSearchConsole.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			'googlesitekit_read_shared_module_data::["search-console"]': true,
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
		} );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
	viewContext: VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY,
};

export const ViewOnlyAnalytics = Template.bind( {} );
ViewOnlyAnalytics.storyName = 'View Only Analytics';
ViewOnlyAnalytics.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
		} );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
	viewContext: VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY,
};

export const ViewOnlySearchConsole = Template.bind( {} );
ViewOnlySearchConsole.storyName = 'View Only Search Console';
ViewOnlySearchConsole.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			'googlesitekit_read_shared_module_data::["search-console"]': true,
		} );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
	viewContext: VIEW_CONTEXT_WP_DASHBOARD_VIEW_ONLY,
};

export const GatheringDataGA4 = Template.bind( {} );
GatheringDataGA4.storyName = 'Gathering Data';
GatheringDataGA4.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		setupSearchConsoleGatheringData( registry );
		setupAnalytics4GatheringData( registry );
	},
};

export const ZeroDataGA4 = Template.bind( {} );
ZeroDataGA4.storyName = 'Zero Data';
ZeroDataGA4.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		setupSearchConsoleZeroData( registry );
		setupAnalytics4ZeroData( registry );
	},
};

export default {
	title: 'Views/WPDashboardApp/WPDashboardWidgets',
	decorators: widgetDecorators,
};
