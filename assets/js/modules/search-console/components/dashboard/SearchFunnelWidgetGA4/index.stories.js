/**
 * SearchFunnelWidgetGA4 Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '../../../../analytics-4/utils/data-mock';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { accountsPropertiesProfiles } from '../../../../analytics/datastore/__fixtures__';
import * as fixtures from '../../../../analytics-4/datastore/__fixtures__';
import { MODULES_SEARCH_CONSOLE } from '../../../datastore/constants';
import { DAY_IN_SECONDS } from '../../../../../util';
import { provideSearchConsoleMockReport } from '../../../util/data-mock';
import SearchFunnelWidgetGA4 from './index';

const propertyID = '1000';
const searchConsoleArgs = {
	startDate: '2021-08-18',
	endDate: '2021-10-12',
	dimensions: 'date',
};
const ga4ReportArgs = [
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				name: 'conversions',
			},
			{
				name: 'engagementRate',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		dimensions: [
			{
				name: 'date',
			},
		],
		metrics: [
			{
				name: 'conversions',
			},
			{
				name: 'engagementRate',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	},
	{
		startDate: '2021-09-15',
		endDate: '2021-10-12',
		compareStartDate: '2021-08-18',
		compareEndDate: '2021-09-14',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		dimensions: [
			{
				name: 'date',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	},
	{
		dimensions: [
			{
				name: 'date',
			},
		],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		startDate: '2021-09-15',
		endDate: '2021-10-12',
	},
];

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	SearchFunnelWidgetGA4
);

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
		for ( const options of ga4ReportArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

export const Analytics4GatheringData = Template.bind( {} );
Analytics4GatheringData.storyName = 'GA4 Gathering Data';
Analytics4GatheringData.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...fixtures.properties[ 0 ],
			createTime,
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		for ( const options of ga4ReportArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } );
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

		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...fixtures.properties[ 0 ],
			createTime,
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );
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
			{
				active: false,
				connected: false,
				slug: 'analytics-4',
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
			{
				active: false,
				connected: false,
				slug: 'analytics-4',
			},
		] );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
	},
};

ReadyWithActivateAnalyticsCTA.scenario = {
	label: 'SearchConsole/SearchFunnelWidgetGA4/ReadyWithActivateAnalyticsCTA',
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
			{
				active: true,
				connected: false,
				slug: 'analytics-4',
			},
		] );
		provideSiteInfo( registry );
		provideUserCapabilities( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		provideModuleRegistrations( registry );
	},
};

export const ReadyWithCreateConversionCTA = Template.bind( {} );
ReadyWithCreateConversionCTA.storyName = 'Ready with Set up Conversions CTA';
ReadyWithCreateConversionCTA.args = {
	setupRegistry: ( registry ) => {
		provideUserAuthentication( registry );
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetConversionEvents( [], {} );

		for ( const options of ga4ReportArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

ReadyWithCreateConversionCTA.scenario = {
	label: 'SearchConsole/SearchFunnelWidgetGA4/ReadyWithCreateConversionCTA',
	delay: 3000,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.startResolution( 'getReport', [ searchConsoleArgs ] );
		for ( const options of ga4ReportArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
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

		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...fixtures.properties[ 0 ],
			createTime,
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		for ( const options of ga4ReportArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } );
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
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ ga4ReportArgs[ 0 ] ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ ga4ReportArgs[ 0 ] ] );
	},
};

export const ReadyEntityDashboard = Template.bind( {} );
ReadyEntityDashboard.storyName = 'Ready Entity Dashboard';
ReadyEntityDashboard.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );

		for ( const options of ga4ReportArgs ) {
			provideAnalytics4MockReport( registry, options );
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
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
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
		for ( const options of ga4ReportArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
};

export default {
	title: 'Modules/SearchConsole/Widgets/SearchFunnelWidgetGA4',
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
				{
					active: true,
					connected: true,
					slug: 'analytics-4',
				},
			] );
			provideUserAuthentication( registry );

			const accountID = fixtures.properties[ 0 ]._accountID;
			const accounts = [
				{
					...accountsPropertiesProfiles.accounts[ 0 ],
					id: accountID,
				},
			];
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetAccounts( accounts );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetProperties( fixtures.properties, {
					accountID,
				} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setPropertyID( propertyID );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetConversionEvents( fixtures.conversionEvents, {} );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
