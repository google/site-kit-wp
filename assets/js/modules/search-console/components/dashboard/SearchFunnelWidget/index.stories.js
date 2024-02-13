/**
 * SearchFunnelWidget Component Stories.
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
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	WithTestRegistry,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { Provider as ViewContextProvider } from '../../../../../components/Root/ViewContextContext';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
} from '../../../../../googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '../../../../../googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '../../../../../googlesitekit/datastore/util/permissions';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { goals } from '../../../../analytics/datastore/__fixtures__';
import { provideAnalyticsMockReport } from '../../../../analytics/util/data-mock';
import { MODULES_SEARCH_CONSOLE } from '../../../datastore/constants';
import { provideSearchConsoleMockReport } from '../../../util/data-mock';
import SearchFunnelWidget from './index';

const searchConsoleArgs = {
	startDate: '2021-08-18',
	endDate: '2021-10-12',
	dimensions: 'date',
};
const analyticsArgs = [
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
			'ga:bounceRate',
		],
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		dimensions: 'ga:date',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
			'ga:bounceRate',
		],
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:channelGrouping' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:date' ],
		dimensionFilters: { 'ga:channelGrouping': 'Organic Search' },
	},
	{
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
			},
		],
		startDate: '2021-09-15',
		endDate: '2021-10-12',
	},
];

const WidgetWithComponentProps =
	withWidgetComponentProps( 'widget-slug' )( SearchFunnelWidget );

function Template( { setupRegistry = () => {}, viewContext, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ViewContextProvider
				value={ viewContext || VIEW_CONTEXT_MAIN_DASHBOARD }
			>
				<WidgetWithComponentProps { ...args } />
			</ViewContextProvider>
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		for ( const options of analyticsArgs ) {
			provideAnalyticsMockReport( registry, options );
		}
		registry.dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals );
	},
};

export const AnalyticsGatheringData = Template.bind( {} );
AnalyticsGatheringData.storyName = 'Analytics Gathering Data';
AnalyticsGatheringData.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );

		for ( const options of analyticsArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport( [], { options } );
		}
	},
};

export const SearchConsoleZeroState = Template.bind( {} );
SearchConsoleZeroState.storyName = 'Search Console Zero State';
SearchConsoleZeroState.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					clicks: 0,
					ctr: 0,
					impressions: 0,
					keys: [ '2021-08-18' ],
					position: 0,
				},
			],
			{
				options: searchConsoleArgs,
			}
		);
	},
};

export const ReadyWithAnalyticsNotActive = Template.bind( {} );
ReadyWithAnalyticsNotActive.storyName = 'Ready with Analytics not active';
ReadyWithAnalyticsNotActive.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'search-console',
			},
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );

		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};

export const ReadyWithActivateAnalyticsCTA = Template.bind( {} );
ReadyWithActivateAnalyticsCTA.storyName = 'Ready with Activate Analytics CTA';
ReadyWithActivateAnalyticsCTA.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'search-console',
			},
			{
				active: false,
				connected: false,
				slug: 'analytics',
			},
		] );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};

ReadyWithActivateAnalyticsCTA.scenario = {
	label: 'SearchConsole/SearchFunnelWidget/ReadyWithActivateAnalyticsCTA',
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
				connected: true,
				slug: 'search-console',
			},
			{
				active: true,
				connected: false,
				slug: 'analytics',
			},
		] );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		provideModuleRegistrations( registry );
	},
};

export const ReadyWithCreateGoalCTA = Template.bind( {} );
ReadyWithCreateGoalCTA.storyName = 'Ready with Create Goal CTA';
ReadyWithCreateGoalCTA.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		for ( const options of analyticsArgs ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
};

ReadyWithCreateGoalCTA.scenario = {
	label: 'SearchConsole/SearchFunnelWidget/ReadyWithCreateGoalCTA',
	delay: 3000,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.startResolution( 'getReport', [ searchConsoleArgs ] );
		for ( const options of analyticsArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS )
				.startResolution( 'getReport', [ options ] );
		}
	},
};

export const DataUnavailable = Template.bind( {} );
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport( [], { options: searchConsoleArgs } );

		for ( const options of analyticsArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport( [], { options } );
		}
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveError( error, 'getReport', [ searchConsoleArgs ] );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ searchConsoleArgs ] );
	},
};

export const ErrorAnalytics = Template.bind( {} );
ErrorAnalytics.storyName = 'Error Analytics';
ErrorAnalytics.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};

		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveError( error, 'getReport', [ analyticsArgs[ 0 ] ] );
		registry
			.dispatch( MODULES_ANALYTICS )
			.finishResolution( 'getReport', [ analyticsArgs[ 0 ] ] );
	},
};

export const ReadyEntityDashboard = Template.bind( {} );
ReadyEntityDashboard.storyName = 'Ready Entity Dashboard';
ReadyEntityDashboard.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );

		for ( const options of analyticsArgs ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
	viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
};

export const ViewOnlySearchConsoleOnlyReady = Template.bind( {} );
ViewOnlySearchConsoleOnlyReady.storyName =
	'ViewOnly - Only Search Console Shared - Ready';
ViewOnlySearchConsoleOnlyReady.args = {
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'search-console',
				shareable: true,
			},
			{
				active: true,
				connected: true,
				slug: 'analytics',
				shareable: false,
			},
		] );
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'search-console'
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				'analytics'
			) ]: false,
		} );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		for ( const options of analyticsArgs ) {
			provideAnalyticsMockReport( registry, options );
		}
		registry.dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals );
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export default {
	title: 'Modules/SearchConsole/Widgets/SearchFunnelWidget',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story ) => {
			const registry = createTestRegistry();
			provideSiteInfo( registry );
			registry.dispatch( CORE_USER ).setReferenceDate( '2021-10-13' );
			registry.dispatch( CORE_USER ).receiveGetAuthentication( {
				needsReauthentication: false,
			} );

			provideModules( registry, [
				{
					active: true,
					connected: true,
					slug: 'search-console',
				},
				{
					active: true,
					connected: true,
					slug: 'analytics',
				},
			] );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
