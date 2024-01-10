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
import { MODULES_ANALYTICS } from '../../../modules/analytics/datastore/constants';
import { provideAnalyticsMockReport } from '../../../modules/analytics/util/data-mock';
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
			provideAnalyticsMockReport( registry, options );
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
				.dispatch( MODULES_ANALYTICS )
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
			provideAnalyticsMockReport( registry, options );
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
				.dispatch( MODULES_ANALYTICS )
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
			provideAnalyticsMockReport( registry, options );
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
						slug: 'analytics',
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
