/**
 * ZeroDataStateNotifications Component Stories.
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
import { provideModules, provideSiteInfo } from '../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { provideAnalytics4MockReport } from '../../../modules/analytics-4/utils/data-mock';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';
import { provideSearchConsoleMockReport } from '../../../modules/search-console/util/data-mock';
import ZeroDataStateNotifications from './';

const searchConsoleArgs = {
	startDate: '2021-08-18',
	endDate: '2021-10-12',
	dimensions: 'date',
};

const analyticsArgs = [
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		dimensionFilters: {
			sessionDefaultChannelGrouping: [ 'Organic Search' ],
		},
	},
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		dimensions: [
			{
				name: 'date',
			},
		],
		limit: 10,
		metrics: [
			{
				name: 'averageSessionDuration',
			},
		],
	},
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ 'date' ],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	},
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
		],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 5,
	},
];

function Template( { setupRegistry } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<ZeroDataStateNotifications />
		</WithRegistrySetup>
	);
}

export const NoNotificationsAvailable = Template.bind( {} );
NoNotificationsAvailable.storyName = 'No Notifications Available';
NoNotificationsAvailable.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );

		for ( const options of analyticsArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

export const AnalyticsGatheringData = Template.bind( {} );
AnalyticsGatheringData.storyName = 'Analytics Gathering Data';
AnalyticsGatheringData.args = {
	setupRegistry: ( registry ) => {
		provideSearchConsoleMockReport( registry, searchConsoleArgs );
		for ( const options of analyticsArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( [], { options } );
		}
	},
};

export const SearchConsoleGatheringData = Template.bind( {} );
SearchConsoleGatheringData.storyName = 'Search Console Gathering Data';
SearchConsoleGatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport( [], { options: searchConsoleArgs } );
		for ( const options of analyticsArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

export const SearchConsoleAndAnalyticsGatheringData = Template.bind( {} );
SearchConsoleAndAnalyticsGatheringData.storyName =
	'Search Console And Analytics Gathering Data';
SearchConsoleAndAnalyticsGatheringData.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport( [], { options: searchConsoleArgs } );
		for ( const options of analyticsArgs ) {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( [], { options } );
		}
	},
};

export const ZeroDataState = Template.bind( {} );
ZeroDataState.storyName = 'Zero Data State';
ZeroDataState.args = {
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
		for ( const options of analyticsArgs ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

export default {
	title: 'Components/ZeroDataStateNotifications',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
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
						slug: 'analytics-4',
					},
				] );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
