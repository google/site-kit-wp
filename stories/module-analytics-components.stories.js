/**
 * Analytics Module Component Stories.
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
import { generateReportBasedWidgetStories, makeReportDataGenerator } from './utils/generate-widget-stories';
import DashboardAllTrafficWidget from '../assets/js/modules/analytics/components/dashboard/DashboardAllTrafficWidget';
import DashboardPopularPagesWidget from '../assets/js/modules/analytics/components/dashboard/DashboardPopularPagesWidget';
import DashboardBounceRateWidget from '../assets/js/modules/analytics/components/dashboard/DashboardBounceRateWidget';
import DashboardGoalsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardGoalsWidget';
import { ModulePopularPagesWidget, ModuleOverviewWidget, ModuleAcquisitionChannelsWidget } from '../assets/js/modules/analytics/components/module';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore/constants';
import { accountsPropertiesProfiles, goals } from '../assets/js/modules/analytics/datastore/__fixtures__';
import { getAnalyticsMockResponse } from '../assets/js/modules/analytics/util/data-mock';

const generateData = makeReportDataGenerator( getAnalyticsMockResponse );

function generateAnalyticsWidgetStories( args ) {
	generateReportBasedWidgetStories( {
		moduleSlugs: [ 'analytics' ],
		datastore: STORE_NAME,
		setup( registry ) {
			const [ property ] = accountsPropertiesProfiles.properties;
			registry.dispatch( STORE_NAME ).receiveGetSettings( {
				// eslint-disable-next-line sitekit/acronym-case
				accountID: property.accountId,
				// eslint-disable-next-line sitekit/acronym-case
				internalWebPropertyID: property.internalWebPropertyId,
				// eslint-disable-next-line sitekit/acronym-case
				profileID: property.defaultProfileId,
			} );
		},
		...args,
	} );
}

const baseAllTrafficArgs = {
	startDate: '2020-12-09',
	endDate: '2021-01-05',
	compareStartDate: '2020-11-11',
	compareEndDate: '2020-12-08',
	metrics: [
		{
			expression: 'ga:users',
		},
	],
};

const allTrafficReports = generateData( [
	{
		...baseAllTrafficArgs,
		dimensions: [
			'ga:channelGrouping',
		],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	{
		...baseAllTrafficArgs,
		dimensions: [
			'ga:country',
		],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	{
		...baseAllTrafficArgs,
		dimensions: [
			'ga:deviceCategory',
		],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	baseAllTrafficArgs,
	{
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [
			'ga:date',
		],
		metrics: [
			{
				expression: 'ga:users',
			},
		],
	},
] );

// Used to modify an Analytics response to only include a single row,
// e.g. if no more than one value of the dimension is available.
function limitResponseToSingleRow( analyticsResponse ) {
	return [
		{
			...analyticsResponse[ 0 ],
			data: {
				...analyticsResponse[ 0 ].data,
				rows: [
					analyticsResponse[ 0 ].data.rows[ 0 ],
				],
			},
		},
	];
}

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	referenceDate: '2021-01-06',
	...allTrafficReports,
	Component: DashboardAllTrafficWidget,
	additionalVariants: {
		'One row of data': {
			options: allTrafficReports.options,
			data: [
				limitResponseToSingleRow( allTrafficReports.data[ 0 ] ),
				limitResponseToSingleRow( allTrafficReports.data[ 1 ] ),
				limitResponseToSingleRow( allTrafficReports.data[ 2 ] ),
				allTrafficReports.data[ 3 ],
				allTrafficReports.data[ 4 ],
			],
		},
	},
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	referenceDate: '2021-01-06',
	...generateData( [
		{
			...baseAllTrafficArgs,
			dimensions: [
				'ga:channelGrouping',
			],
			orderby: {
				fieldName: 'ga:users',
				sortOrder: 'DESCENDING',
			},
			limit: 6,
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...baseAllTrafficArgs,
			dimensions: [
				'ga:country',
			],
			orderby: {
				fieldName: 'ga:users',
				sortOrder: 'DESCENDING',
			},
			limit: 6,
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...baseAllTrafficArgs,
			dimensions: [
				'ga:deviceCategory',
			],
			orderby: {
				fieldName: 'ga:users',
				sortOrder: 'DESCENDING',
			},
			limit: 6,
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...baseAllTrafficArgs,
			url: 'https://www.elasticpress.io/features/',
		},
		{
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			dimensions: [
				'ga:date',
			],
			metrics: [
				{
					expression: 'ga:users',
				},
			],
			url: 'https://www.elasticpress.io/features/',
		},
	] ),
	Component: DashboardAllTrafficWidget,
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Page Dashboard/Bounce Rate Widget',
	referenceDate: '2020-09-10',
	...generateData( {
		compareStartDate: '2020-07-16',
		compareEndDate: '2020-08-12',
		startDate: '2020-08-13',
		endDate: '2020-09-09',
		dimensions: 'ga:date',
		metrics: [
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce Rate',
			},
		],
		url: 'https://www.sitekit.com/',
	} ),
	Component: DashboardBounceRateWidget,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Dashboard/Goals Widget',
	referenceDate: '2020-12-30',
	...generateData( [
		{
			compareStartDate: '2020-11-04',
			compareEndDate: '2020-12-01',
			startDate: '2020-12-02',
			endDate: '2020-12-29',
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:goalCompletionsAll',
					alias: 'Goal Completions',
				},
			],
		},
		{
			compareStartDate: '2020-11-04',
			compareEndDate: '2020-12-01',
			startDate: '2020-12-02',
			endDate: '2020-12-29',
			url: null,
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
		},
	] ),
	Component: DashboardGoalsWidget,
	additionalVariants: {
		'No Goals':
		{
			referenceDate: '2020-09-10',
			...generateData( {
				// Using negative date range to generate an empty report.
				compareStartDate: '2020-07-16',
				compareEndDate: '2020-07-15',
				startDate: '2020-08-13',
				endDate: '2020-08-12',
				dimensions: 'ga:date',
				metrics: [
					{
						expression: 'ga:goalCompletionsAll',
						alias: 'Goal Completions',
					},
				],
			} ),
		},
	},
	additionalVariantCallbacks: {
		Loaded: ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
		DataUnavailable: ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
	},
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Dashboard/Popular Pages Widget',
	referenceDate: '2020-09-10',
	...generateData( {
		startDate: '2020-08-13',
		endDate: '2020-09-09',
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	} ),
	Component: DashboardPopularPagesWidget,
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Module Page/Overview Widget',
	referenceDate: '2021-01-06',
	...generateData( [
		{
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			compareStartDate: '2020-11-11',
			compareEndDate: '2020-12-08',
			metrics: [
				'ga:users',
				'ga:sessions',
				'ga:bounceRate',
				'ga:avgSessionDuration',
			],
		},
		{
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			compareStartDate: '2020-11-11',
			compareEndDate: '2020-12-08',
			dimensions: 'ga:date',
			metrics: [
				'ga:users',
				'ga:sessions',
				'ga:bounceRate',
				'ga:avgSessionDuration',
			],
		},
	] ),
	Component: ModuleOverviewWidget,
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Module Page/Popular Pages Widget',
	referenceDate: '2021-01-06',
	...generateData( {
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [
			'ga:pageTitle',
			'ga:pagePath',
		],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce rate',
			},
		],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 10,
	} ),
	Component: ModulePopularPagesWidget,
	wrapWidget: false,
} );
generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Module Page/Acquisition Channels Widget',
	referenceDate: '2021-01-06',
	...generateData(
		{
			dimensions: 'ga:channelGrouping',
			metrics: [
				{
					expression: 'ga:sessions',
					alias: 'Sessions',
				},
				{
					expression: 'ga:users',
					alias: 'Users',
				},
				{
					expression: 'ga:newUsers',
					alias: 'New Users',
				},
			],
			orderby: [
				{
					fieldName: 'ga:users',
					sortOrder: 'DESCENDING',
				},
			],
			limit: 10,
			startDate: '2020-12-09',
			endDate: '2021-01-05',
		}
	),
	Component: ModuleAcquisitionChannelsWidget,
	wrapWidget: false,
} );
