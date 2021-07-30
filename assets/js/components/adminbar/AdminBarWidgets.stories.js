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
import { provideModules, provideSiteInfo } from '../../../../tests/js/utils';
import { setupSearchConsoleAnalyticsMockReports, setupAnalyticsMockReports, setupSearchConsoleMockReports } from './common.stories';
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
Ready.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
			] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const DataUnavailable = Template.bind( {} );
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
			] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const AnalyticsDataUnavailable = Template.bind( {} );
AnalyticsDataUnavailable.storyName = 'Data Unavailable: Analytics';
AnalyticsDataUnavailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
			] );

			setupSearchConsoleMockReports( registry );
			setupAnalyticsMockReports( registry, [] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const AnalyticsInactive = Template.bind( {} );
AnalyticsInactive.storyName = 'Inactive: Analytics';
AnalyticsInactive.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
			] );

			setupSearchConsoleMockReports( registry );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const SearchConsoleDataUnavailable = Template.bind( {} );
SearchConsoleDataUnavailable.storyName = 'Data Unavailable: Search Console';
SearchConsoleDataUnavailable.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Set up the search console and analytics modules stores but provide no data.
			provideModules( registry, [
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
			] );

			setupSearchConsoleMockReports( registry, [] );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Views/AdminBarApp/AdminBarWidgets',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				// Set some site information.
				provideSiteInfo( registry, {
					currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
					currentEntityTitle: 'Blog test post for Google Site Kit',
				} );

				// Call story-specific setup.
				if ( typeof args?.setupRegistry === 'function' ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<div className="googlesitekit-widget">
						<div className="googlesitekit-widget__body">
							<Story />
						</div>
					</div>
				</WithRegistrySetup>
			);
		},
	],
};
