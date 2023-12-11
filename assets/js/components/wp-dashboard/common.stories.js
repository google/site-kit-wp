/**
 * Shared exports among WPDashboard Stories.
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
import { provideModules, provideSiteInfo } from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { getAnalyticsMockResponse } from '../../modules/analytics/util/data-mock';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideSearchConsoleMockReport } from '../../modules/search-console/util/data-mock';
import { replaceValuesInAnalyticsReportWithZeroData } from '../../../../.storybook/utils/zeroReports';

const wpDashboardSearchConsoleOptions = {
	startDate: '2020-12-03',
	endDate: '2021-01-27',
	dimensions: 'date',
};

export const wpDashboardAnalyticsOptionSets = [
	// Mock options for mocking isGatheringData selector's response.
	{
		dimensions: [ 'ga:date' ],
		metrics: [ { expression: 'ga:users' } ],
		startDate: '2020-12-31',
		endDate: '2021-01-27',
	},

	// Mock options for mocking "Total Users" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	},

	// Mock options for mocking "Total Users" chart widget response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
		dimensions: [ 'ga:date' ],
	},

	// Mock options for mocking "Sessions" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		dimensions: 'ga:date',
		limit: 10,
		metrics: [
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Average Session Duration',
			},
		],
	},

	// Mock options for mocking "Popular Pages" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		dimensions: [ 'ga:pagePath' ],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 5,
	},
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		dimensions: [ 'ga:pagePath', 'ga:pageTitle' ],
		dimensionFilters: {
			'ga:pagePath': [
				'/test-post-1/',
				'/test-post-2/',
				'/test-post-3/',
				'/test-post-4/',
				'/test-post-5/',
			],
		},
		metrics: [ { expression: 'ga:pageviews', alias: 'Pageviews' } ],
		orderby: [ { fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' } ],
		limit: 25,
	},
];

export const setupBaseRegistry = ( registry, args ) => {
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
		{
			slug: 'analytics-4',
			active: true,
			connected: true,
		},
	] );

	// Set some site information.
	provideSiteInfo( registry );

	// Call story-specific setup.
	if ( typeof args?.setupRegistry === 'function' ) {
		args.setupRegistry( registry );
	}
};

export const setupSearchConsoleMockReports = ( registry, data ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	if ( data ) {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( data, {
			options: wpDashboardSearchConsoleOptions,
		} );
	} else {
		provideSearchConsoleMockReport(
			registry,
			wpDashboardSearchConsoleOptions
		);
	}
};

export const setupAnalyticsMockReports = (
	registry,
	mockOptions = wpDashboardAnalyticsOptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	mockOptions.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetReport( getAnalyticsMockResponse( options ), {
				options,
			} );
	} );
};

export const setupSearchConsoleAnalyticsMockReports = ( registry ) => {
	setupSearchConsoleMockReports( registry );
	setupAnalyticsMockReports( registry );
};

export const widgetDecorators = [
	( Story ) => (
		<div id="dashboard-widgets">
			<div id="google_dashboard_widget" style={ { maxWidth: '600px' } }>
				<div className="inside">
					<div className="googlesitekit-wp-dashboard">
						<div className="googlesitekit-widget">
							<div className="googlesitekit-widget__body">
								<Story />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	),
	( Story, { args } ) => {
		const setupRegistry = ( registry ) => {
			setupBaseRegistry( registry, args );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const setupSearchConsoleGatheringData = ( registry ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
		options: wpDashboardSearchConsoleOptions,
	} );
};

export const setupAnalyticsGatheringData = (
	registry,
	mockOptions = wpDashboardAnalyticsOptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	mockOptions.forEach( ( options ) => {
		registry.dispatch( MODULES_ANALYTICS ).receiveGetReport(
			[
				{
					data: {
						rows: [],
						totals: [ { values: [] }, { values: [] } ],
					},
				},
			],
			{
				options,
			}
		);
	} );
};

export const setupSearchConsoleAnalyticsGatheringData = ( registry ) => {
	setupSearchConsoleGatheringData( registry );
	setupAnalyticsGatheringData( registry );
};

export const setupSearchConsoleZeroData = ( registry ) => {
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
			options: wpDashboardSearchConsoleOptions,
		}
	);
};

export function setupAnalyticsZeroData(
	registry,
	mockOptionSets = wpDashboardAnalyticsOptionSets
) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptionSets.forEach( ( options ) => {
		const report = getAnalyticsMockResponse( options );
		const zeroReport = replaceValuesInAnalyticsReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( zeroReport, {
			options,
		} );
	} );
}

export const setupSearchConsoleAnalyticsZeroData = ( registry ) => {
	setupSearchConsoleZeroData( registry );
	setupAnalyticsZeroData( registry );
};
