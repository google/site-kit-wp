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
import {
	generateReportBasedWidgetStories,
	makeReportDataGenerator,
} from './utils/generate-widget-stories';
import { replaceValuesInAnalyticsReportWithZeroData } from '../.storybook/utils/zeroReports';
import {
	ModulePopularPagesWidget,
	ModuleOverviewWidget,
	ModuleAcquisitionChannelsWidget,
} from '../assets/js/modules/analytics/components/module';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import {
	accountsPropertiesProfiles,
	goals,
} from '../assets/js/modules/analytics/datastore/__fixtures__';
import { getAnalyticsMockResponse } from '../assets/js/modules/analytics/util/data-mock';
import {
	DashboardPopularPagesWidget,
	DashboardGoalsWidget,
	DashboardAllTrafficWidget,
	DashboardBounceRateWidget,
} from '../assets/js/modules/analytics/components/dashboard';

const generateData = makeReportDataGenerator( getAnalyticsMockResponse );

function generateAnalyticsWidgetStories( args ) {
	generateReportBasedWidgetStories( {
		moduleSlugs: [ 'analytics' ],
		datastore: MODULES_ANALYTICS,
		setup( registry ) {
			const [ property ] = accountsPropertiesProfiles.properties;
			registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
				// eslint-disable-next-line sitekit/acronym-case
				accountID: property.accountId,
				// eslint-disable-next-line sitekit/acronym-case
				internalWebPropertyID: property.internalWebPropertyId,
				// eslint-disable-next-line sitekit/acronym-case
				profileID: property.defaultProfileId,
			} );
		},
		zeroing( report, options ) {
			const specialDimensions = [
				'ga:pagePath',
				'ga:channelGrouping',
				'ga:deviceCategory',
				'ga:country',
			];

			// If the report includes one of the special dimensions, then we need to return an empty array.
			for ( const dimension of specialDimensions ) {
				if ( options?.dimensions?.includes( dimension ) ) {
					return [];
				}
			}

			const zeroValues = ( { values } ) => ( {
				values: values.map( () => 0 ),
			} );

			return report.map( ( single ) => ( {
				...single,
				data: {
					...single.data,
					totals: single.data.totals.map( zeroValues ),
					maximums: single.data.maximums.map( zeroValues ),
					minimums: single.data.minimums.map( zeroValues ),
					rows: single.data.rows.map(
						( { dimensions, metrics } ) => ( {
							dimensions,
							metrics: metrics.map( zeroValues ),
						} )
					),
				},
			} ) );
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
		dimensions: [ 'ga:channelGrouping' ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	{
		...baseAllTrafficArgs,
		dimensions: [ 'ga:country' ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	{
		...baseAllTrafficArgs,
		dimensions: [ 'ga:deviceCategory' ],
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
		dimensions: [ 'ga:date' ],
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
				rows: [ analyticsResponse[ 0 ].data.rows[ 0 ] ],
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
		'Zero rows of data': {
			options: allTrafficReports.options,
			data: allTrafficReports.data.map(
				replaceValuesInAnalyticsReportWithZeroData
			),
			features: [ 'zeroDataStates' ],
		},
	},
	wrapWidget: false,
} );

const allTrafficPageReports = generateData( [
	{
		...baseAllTrafficArgs,
		dimensions: [ 'ga:channelGrouping' ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
	},
	{
		...baseAllTrafficArgs,
		dimensions: [ 'ga:country' ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
	},
	{
		...baseAllTrafficArgs,
		dimensions: [ 'ga:deviceCategory' ],
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
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:users',
			},
		],
		url: 'https://www.elasticpress.io/features/',
	},
	{
		dimensions: [ 'ga:date' ],
		metrics: [ { expression: 'ga:users' } ],
		startDate: '2020-12-09',
		endDate: '2021-01-05',
	},
] );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	referenceDate: '2021-01-06',
	...allTrafficPageReports,
	Component: DashboardAllTrafficWidget,
	additionalVariants: {
		'Zero rows of data': {
			options: allTrafficPageReports.options,
			data: allTrafficPageReports.data.map(
				replaceValuesInAnalyticsReportWithZeroData
			),
			features: [ 'zeroDataStates' ],
		},
	},
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Page Dashboard/Bounce Rate Widget',
	referenceDate: '2020-09-10',
	...generateData( [
		{
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
		},
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-08-13',
			endDate: '2020-09-09',
			url: 'https://www.sitekit.com/',
		},
	] ),
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
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-12-02',
			endDate: '2020-12-29',
		},
	] ),
	Component: DashboardGoalsWidget,
	additionalVariants: {
		'No Goals': {
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
		Loaded: ( dispatch ) =>
			dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals ),
		DataUnavailable: ( dispatch ) =>
			dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals ),
		ZeroData: ( dispatch ) =>
			dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals ),
	},
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Dashboard/Popular Pages Widget',
	referenceDate: '2020-09-10',
	...generateData( [
		{
			startDate: '2020-08-13',
			endDate: '2020-09-09',
			dimensions: [ 'ga:pagePath' ],
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
		},
		{
			startDate: '2020-08-13',
			endDate: '2020-09-09',
			dimensionFilters: {
				'ga:pagePath': new Array( 10 )
					.fill( '' )
					.map( ( _, i ) => `/test-post-${ i + 1 }/` )
					.sort(),
			},
			dimensions: [ 'ga:pagePath', 'ga:pageTitle' ],
			metrics: [ { expression: 'ga:pageviews', alias: 'Pageviews' } ],
			orderby: [ { fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' } ],
			limit: 50,
		},
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-08-13',
			endDate: '2020-09-09',
		},
	] ),
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
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-12-09',
			endDate: '2021-01-05',
		},
	] ),
	Component: ModuleOverviewWidget,
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group: 'Analytics Module/Components/Module Page/Popular Pages Widget',
	referenceDate: '2021-01-06',
	...generateData( [
		{
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			dimensions: [ 'ga:pagePath' ],
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
		},
		{
			startDate: '2020-12-09',
			endDate: '2021-01-05',
			dimensionFilters: {
				'ga:pagePath': new Array( 10 )
					.fill( '' )
					.map( ( _, i ) => `/test-post-${ i + 1 }/` )
					.sort(),
			},
			dimensions: [ 'ga:pagePath', 'ga:pageTitle' ],
			metrics: [ { expression: 'ga:pageviews', alias: 'Pageviews' } ],
			orderby: [ { fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' } ],
			limit: 50,
		},
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-12-09',
			endDate: '2021-01-05',
		},
	] ),
	Component: ModulePopularPagesWidget,
	wrapWidget: false,
} );

generateAnalyticsWidgetStories( {
	group:
		'Analytics Module/Components/Module Page/Acquisition Channels Widget',
	referenceDate: '2021-01-06',
	...generateData( [
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
		},
		{
			dimensions: [ 'ga:date' ],
			metrics: [ { expression: 'ga:users' } ],
			startDate: '2020-12-09',
			endDate: '2021-01-05',
		},
	] ),
	Component: ModuleAcquisitionChannelsWidget,
	wrapWidget: false,
} );
