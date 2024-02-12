/**
 * Admin Bar App Component Stories.
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
	setupAnalytics4GatheringData,
	setupBaseRegistry,
	setupSearchConsoleGatheringData,
	setupSearchConsoleMockReports,
	setupAnalytics4MockReports,
	setupSearchConsoleZeroData,
	setupAnalytics4ZeroData,
} from './common-GA4.stories';
import { Provider as ViewContextProvider } from '../Root/ViewContextContext';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import AdminBarApp from './AdminBarApp';
import {
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../tests/js/utils';
import { VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY } from '../../googlesitekit/constants';

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider value={ viewContext }>
				<AdminBarApp { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		setupSearchConsoleMockReports( registry );
		setupAnalytics4MockReports( registry );
	},
};
Ready.scenario = {
	label: 'Global/Admin Bar',
	readySelector: '.googlesitekit-data-block',
	delay: 250,
};

export const ViewOnlyAnalyticsAndSearchConsole = Template.bind( {} );
ViewOnlyAnalyticsAndSearchConsole.storyName =
	'View Only Analytics And Search Console';
ViewOnlyAnalyticsAndSearchConsole.args = {
	setupRegistry: ( registry ) => {
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
	setupRegistry: ( registry ) => {
		setupSearchConsoleGatheringData( registry );
		setupAnalytics4GatheringData( registry );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( registry ) => {
		setupSearchConsoleZeroData( registry );
		setupAnalytics4ZeroData( registry );
	},
};

export default {
	title: 'Views/AdminBarApp/AdminBarApp',
	decorators: [
		( Story ) => (
			<div id="wpadminbar">
				<div className="googlesitekit-plugin">
					<div
						id="js-googlesitekit-adminbar"
						className="ab-sub-wrapper googlesitekit-adminbar"
						style={ { display: 'block' } }
					>
						<section
							id="js-googlesitekit-adminbar-modules"
							className="googlesitekit-adminbar-modules"
						>
							<Story />
						</section>
					</div>
				</div>
			</div>
		),
		( Story, { args } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry ) => {
						setupBaseRegistry( registry, args );
					} }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
