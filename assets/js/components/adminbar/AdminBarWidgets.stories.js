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
	provideUserCapabilities,
} from '../../../../tests/js/utils';
import {
	setupSearchConsoleMockReports,
	setupSearchConsoleAnalyticsGatheringData,
	setupSearchConsoleAnalyticsZeroData,
	widgetDecorators,
} from './common.stories';
import {
	setupAnalytics4Loading,
	setupAnalytics4MockReports,
} from './common-GA4.stories';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY } from '../../googlesitekit/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import AdminBarWidgets from './AdminBarWidgets';

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ viewContext }>
				<AdminBarWidgets { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
};

export const AnalyticsInactive = Template.bind( {} );
AnalyticsInactive.storyName = 'Inactive: Analytics Setup CTA';
AnalyticsInactive.args = {
	setupRegistry: ( registry ) => {
		// Set up the search console module store but provide no data.
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );
		setupSearchConsoleMockReports( registry );
	},
};

export const AnalyticsInactiveNewCompleteActivation = Template.bind( {} );
AnalyticsInactiveNewCompleteActivation.storyName =
	'Inactive: Analytics Complete Activation CTA';
AnalyticsInactiveNewCompleteActivation.args = {
	setupRegistry: ( registry ) => {
		// Set up the analytics module store but provide no data.
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
	},
};

export const AnalyticsActiveWithGA4Enabled = Template.bind( {} );
AnalyticsActiveWithGA4Enabled.storyName = 'Active: With GA4 Enabled';
AnalyticsActiveWithGA4Enabled.args = {
	setupRegistry: ( registry ) => {
		// Set up the analytics module store but provide no data.
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
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
};

export const Analytics4WidgetsLoading = Template.bind( {} );
Analytics4WidgetsLoading.storyName = 'GA4 Widgets Loading';
Analytics4WidgetsLoading.args = {
	setupRegistry: ( registry ) => {
		// Set up the analytics module store but provide no data.
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
		provideUserAuthentication( registry );
		setupSearchConsoleMockReports( registry );
		setupAnalytics4Loading( registry );
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
	viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
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
	viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
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
	viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
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
