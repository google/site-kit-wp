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
import { generateReportBasedWidgetStories } from './utils/generate-widget-stories';
import DashboardAllTrafficWidget from '../assets/js/modules/analytics/components/dashboard/DashboardAllTrafficWidget';
import DashboardPopularPagesWidget from '../assets/js/modules/analytics/components/dashboard/DashboardPopularPagesWidget';
import DashboardBounceRateWidget from '../assets/js/modules/analytics/components/dashboard/DashboardBounceRateWidget';
import DashboardGoalsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardGoalsWidget';
import DashboardUniqueVisitorsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardUniqueVisitorsWidget';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore/constants';
import {
	accountsPropertiesProfiles,
	goals,
	dashboardUserDimensionsArgs,
	dashboardUserDimensionsData,
	dashboardUserTotalsArgs,
	dashboardUserTotalsData,
	dashboardUserGraphArgs,
	dashboardUserGraphData,
} from '../assets/js/modules/analytics/datastore/__fixtures__';

/**
 * Defines some additional setup for all stories.
 *
 * @since 1.19.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 */
const setup = ( registry ) => {
	const [ property ] = accountsPropertiesProfiles.properties;
	registry.dispatch( STORE_NAME ).receiveGetSettings( {
		// eslint-disable-next-line sitekit/acronym-case
		accountID: property.accountId,
		// eslint-disable-next-line sitekit/acronym-case
		internalWebPropertyID: property.internalWebPropertyId,
		// eslint-disable-next-line sitekit/acronym-case
		profileID: property.defaultProfileId,
	} );
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	referenceDate: '2021-01-06',
	// The following fixtures need to be based on the above reference date.
	data: [
		dashboardUserDimensionsData[ 'ga:channelGrouping' ],
		dashboardUserDimensionsData[ 'ga:country' ],
		dashboardUserDimensionsData[ 'ga:deviceCategory' ],
		dashboardUserTotalsData,
		dashboardUserGraphData,
	],
	options: [
		dashboardUserDimensionsArgs[ 'ga:channelGrouping' ],
		dashboardUserDimensionsArgs[ 'ga:country' ],
		dashboardUserDimensionsArgs[ 'ga:deviceCategory' ],
		dashboardUserTotalsArgs,
		dashboardUserGraphArgs,
	],
	Component: DashboardAllTrafficWidget,
	additionalVariants: {
		'One row of data': {
			data: [
				{
					nextPageToken: null,
					columnHeader: {
						dimensions: [
							'ga:channelGrouping',
						],
						metricHeader: {
							metricHeaderEntries: [
								{
									name: 'ga:users',
									type: 'INTEGER',
								},
							],
						},
					},
				},
				{
					dataLastRefreshed: null,
					isDataGolden: null,
					rowCount: 1,
					samplesReadCounts: null,
					samplingSpaceSizes: null,
					rows: [ {
						dimensions: [ 'Organic Search' ],
						metrics: [
							{
								values: [ '1951' ],
							},
							{
								values: [ '510' ],
							},
						],
					} ],
					totals: [ {
						values: [ '1951' ],
					},
					{
						values: [ '510' ],
					} ],
					minimums: [
						{
							values: [ '1951' ],
						},
						{
							values: [ '510' ],
						},
					],
					maximums: [
						{
							values: [ '1951' ],
						},
						{
							values: [ '510' ],
						},
					],
				} ],
			referenceDate: '2021-01-06',
			options: {
				startDate: '2020-12-09',
				endDate: '2021-01-05',
				compareStartDate: '2020-11-11',
				compareEndDate: '2020-12-08',
				metrics: [ {
					expression: 'ga:users',
				} ],
			},
		},
	},
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	referenceDate: '2021-01-06',
	data: [
		dashboardUserDimensionsData[ 'ga:channelGrouping' ],
		dashboardUserDimensionsData[ 'ga:country' ],
		dashboardUserDimensionsData[ 'ga:deviceCategory' ],
		dashboardUserTotalsData,
		dashboardUserGraphData,
	],
	options: [
		{
			...dashboardUserDimensionsArgs[ 'ga:channelGrouping' ],
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...dashboardUserDimensionsArgs[ 'ga:country' ],
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...dashboardUserDimensionsArgs[ 'ga:deviceCategory' ],
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...dashboardUserTotalsArgs,
			url: 'https://www.elasticpress.io/features/',
		},
		{
			...dashboardUserGraphArgs,
			url: 'https://www.elasticpress.io/features/',
		},
	],
	Component: DashboardAllTrafficWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Bounce Rate Widget',
	data: [
		{
			nextPageToken: null,
			columnHeader: {
				dimensions: [
					'ga:date',
				],
				metricHeader: {
					metricHeaderEntries: [
						{
							name: 'Bounce Rate',
							type: 'PERCENT',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 56,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'20200813',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200814',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200815',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200816',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200817',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200818',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200819',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200820',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200821',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200822',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200823',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200824',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200825',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200826',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200827',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200828',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200829',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200830',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200831',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200901',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200902',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200903',
						],
						metrics: [
							{
								values: [
									'33.33333333333333',
								],
							},
						],
					},
					{
						dimensions: [
							'20200904',
						],
						metrics: [
							{
								values: [
									'25.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200905',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200906',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200907',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200908',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200909',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'57.047387606318345',
						],
					},
					{
						values: [
							'56.31728045325779',
						],
					},
				],
				minimums: [
					{
						values: [
							'0.0',
						],
					},
					{
						values: [
							'0.0',
						],
					},
				],
				maximums: [
					{
						values: [
							'82.29166666666666',
						],
					},
					{
						values: [
							'67.41573033707866',
						],
					},
				],
			},
		},
	],
	referenceDate: '2020-09-10',
	options: {
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
	},
	Component: DashboardBounceRateWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Bounce Rate Widget',
	data: [
		{
			nextPageToken: null,
			columnHeader: {
				dimensions: [
					'ga:date',
				],
				metricHeader: {
					metricHeaderEntries: [
						{
							name: 'Bounce Rate',
							type: 'PERCENT',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 56,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'20200813',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200814',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200815',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200816',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200817',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200818',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200819',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200820',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200821',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200822',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200823',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200824',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200825',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200826',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200827',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200828',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200829',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200830',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200831',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200901',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200902',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200903',
						],
						metrics: [
							{
								values: [
									'33.33333333333333',
								],
							},
						],
					},
					{
						dimensions: [
							'20200904',
						],
						metrics: [
							{
								values: [
									'25.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200905',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200906',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200907',
						],
						metrics: [
							{
								values: [
									'0.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200908',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
					{
						dimensions: [
							'20200909',
						],
						metrics: [
							{
								values: [
									'100.0',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'79.3103448275862',
						],
					},
					{
						values: [
							'18.181818181818183',
						],
					},
				],
				minimums: [
					{
						values: [
							'0.0',
						],
					},
					{
						values: [
							'0.0',
						],
					},
				],
				maximums: [
					{
						values: [
							'100.0',
						],
					},
					{
						values: [
							'100.0',
						],
					},
				],
			},
		},
	],
	referenceDate: '2020-09-10',
	options: {
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
	Component: DashboardBounceRateWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Goals Widget',
	data: [
		{
			nextPageToken: null,
			columnHeader: {
				dimensions: [
					'ga:date',
				],
				metricHeader: {
					metricHeaderEntries: [
						{
							name: 'Goal Completions',
							type: 'INTEGER',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 56,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'20201104',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'4',
								],
							},
						],
					},
					{
						dimensions: [
							'20201105',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'7',
								],
							},
						],
					},
					{
						dimensions: [
							'20201106',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'17',
								],
							},
						],
					},
					{
						dimensions: [
							'20201107',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'2',
								],
							},
						],
					},
					{
						dimensions: [
							'20201108',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'4',
								],
							},
						],
					},
					{
						dimensions: [
							'20201109',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'13',
								],
							},
						],
					},
					{
						dimensions: [
							'20201110',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'45',
								],
							},
						],
					},
					{
						dimensions: [
							'20201111',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'54',
								],
							},
						],
					},
					{
						dimensions: [
							'20201112',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'54',
								],
							},
						],
					},
					{
						dimensions: [
							'20201113',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'34',
								],
							},
						],
					},
					{
						dimensions: [
							'20201114',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'20',
								],
							},
						],
					},
					{
						dimensions: [
							'20201115',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'19',
								],
							},
						],
					},
					{
						dimensions: [
							'20201116',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'48',
								],
							},
						],
					},
					{
						dimensions: [
							'20201117',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'73',
								],
							},
						],
					},
					{
						dimensions: [
							'20201118',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'93',
								],
							},
						],
					},
					{
						dimensions: [
							'20201119',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'113',
								],
							},
						],
					},
					{
						dimensions: [
							'20201120',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'47',
								],
							},
						],
					},
					{
						dimensions: [
							'20201121',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'23',
								],
							},
						],
					},
					{
						dimensions: [
							'20201122',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'39',
								],
							},
						],
					},
					{
						dimensions: [
							'20201123',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'61',
								],
							},
						],
					},
					{
						dimensions: [
							'20201124',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'93',
								],
							},
						],
					},
					{
						dimensions: [
							'20201125',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'55',
								],
							},
						],
					},
					{
						dimensions: [
							'20201126',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'41',
								],
							},
						],
					},
					{
						dimensions: [
							'20201127',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'42',
								],
							},
						],
					},
					{
						dimensions: [
							'20201128',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'21',
								],
							},
						],
					},
					{
						dimensions: [
							'20201129',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'27',
								],
							},
						],
					},
					{
						dimensions: [
							'20201130',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'48',
								],
							},
						],
					},
					{
						dimensions: [
							'20201201',
						],
						metrics: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'49',
								],
							},
						],
					},
					{
						dimensions: [
							'20201202',
						],
						metrics: [
							{
								values: [
									'42',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201203',
						],
						metrics: [
							{
								values: [
									'77',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201204',
						],
						metrics: [
							{
								values: [
									'48',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201205',
						],
						metrics: [
							{
								values: [
									'16',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201206',
						],
						metrics: [
							{
								values: [
									'20',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201207',
						],
						metrics: [
							{
								values: [
									'56',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201208',
						],
						metrics: [
							{
								values: [
									'64',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201209',
						],
						metrics: [
							{
								values: [
									'57',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201210',
						],
						metrics: [
							{
								values: [
									'67',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201211',
						],
						metrics: [
							{
								values: [
									'44',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201212',
						],
						metrics: [
							{
								values: [
									'17',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201213',
						],
						metrics: [
							{
								values: [
									'41',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201214',
						],
						metrics: [
							{
								values: [
									'76',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201215',
						],
						metrics: [
							{
								values: [
									'57',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201216',
						],
						metrics: [
							{
								values: [
									'53',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201217',
						],
						metrics: [
							{
								values: [
									'64',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201218',
						],
						metrics: [
							{
								values: [
									'41',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201219',
						],
						metrics: [
							{
								values: [
									'10',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201220',
						],
						metrics: [
							{
								values: [
									'17',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201221',
						],
						metrics: [
							{
								values: [
									'64',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201222',
						],
						metrics: [
							{
								values: [
									'39',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201223',
						],
						metrics: [
							{
								values: [
									'46',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201224',
						],
						metrics: [
							{
								values: [
									'18',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201225',
						],
						metrics: [
							{
								values: [
									'7',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201226',
						],
						metrics: [
							{
								values: [
									'14',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201227',
						],
						metrics: [
							{
								values: [
									'12',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201228',
						],
						metrics: [
							{
								values: [
									'23',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
					{
						dimensions: [
							'20201229',
						],
						metrics: [
							{
								values: [
									'28',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'1118',
						],
					},
					{
						values: [
							'1146',
						],
					},
				],
				minimums: [
					{
						values: [
							'0',
						],
					},
					{
						values: [
							'0',
						],
					},
				],
				maximums: [
					{
						values: [
							'77',
						],
					},
					{
						values: [
							'113',
						],
					},
				],
			},
		},
	],
	referenceDate: '2020-12-30',
	options: {
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
	Component: DashboardGoalsWidget,
	additionalVariants: {
		'No Goals':
		{
			data: [
				{
					nextPageToken: null,
					columnHeader: {
						dimensions: [
							'ga:date',
						],
						metricHeader: {
							metricHeaderEntries: [
								{
									name: 'Goal Completions',
									type: 'INTEGER',
								},
							],
						},
					},
					data: {
						dataLastRefreshed: null,
						isDataGolden: null,
						rowCount: null,
						samplesReadCounts: null,
						samplingSpaceSizes: null,
						rows: [
							{
								dimensions: [
									'20200813',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200814',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200815',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200816',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200817',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200818',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200819',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200820',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200821',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200822',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200823',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200824',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200825',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200826',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200827',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200828',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200829',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200830',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200831',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200901',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200902',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200903',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200904',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200905',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200906',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200907',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200908',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
							{
								dimensions: [
									'20200909',
								],
								metrics: [
									{
										values: [
											'0',
										],
									},
								],
							},
						],
						totals: [
							{
								values: [
									'0',
								],
							},
							{
								values: [
									'0',
								],
							},
						],
					},
				},
			],
			referenceDate: '2020-09-10',
			options: {
				compareStartDate: '2020-07-16',
				compareEndDate: '2020-08-12',
				startDate: '2020-08-13',
				endDate: '2020-09-09',
				dimensions: 'ga:date',
				metrics: [
					{
						expression: 'ga:goalCompletionsAll',
						alias: 'Goal Completions',
					},
				],
			},
		},
	},
	additionalVariantCallbacks: {
		Loaded: ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
		'Data Unavailable': ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
	},
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Unique Visitors Widget',
	data: [
		[
			{
				nextPageToken: null,
				columnHeader: {
					dimensions: null,
					metricHeader: {
						metricHeaderEntries: [
							{
								name: 'Total Users',
								type: 'INTEGER',
							},
						],
					},
				},
				data: {
					dataLastRefreshed: null,
					isDataGolden: null,
					rowCount: 1,
					samplesReadCounts: null,
					samplingSpaceSizes: null,
					rows: [
						{
							dimensions: null,
							metrics: [
								{
									values: [
										'1176',
									],
								},
								{
									values: [
										'1356',
									],
								},
							],
						},
					],
					totals: [
						{
							values: [
								'1176',
							],
						},
						{
							values: [
								'1356',
							],
						},
					],
					minimums: [
						{
							values: [
								'1176',
							],
						},
						{
							values: [
								'1356',
							],
						},
					],
					maximums: [
						{
							values: [
								'1176',
							],
						},
						{
							values: [
								'1356',
							],
						},
					],
				},
			},
		],
		[
			{
				nextPageToken: null,
				columnHeader: {
					dimensions: [
						'ga:date',
					],
					metricHeader: {
						metricHeaderEntries: [
							{
								name: 'Users',
								type: 'INTEGER',
							},
							{
								name: 'Sessions',
								type: 'INTEGER',
							},
							{
								name: 'Bounce Rate',
								type: 'PERCENT',
							},
							{
								name: 'Average Session Duration',
								type: 'TIME',
							},
							{
								name: 'Goal Completions',
								type: 'INTEGER',
							},
						],
					},
				},
				data: {
					dataLastRefreshed: null,
					isDataGolden: null,
					rowCount: 56,
					samplesReadCounts: null,
					samplingSpaceSizes: null,
					rows: [
						{
							dimensions: [
								'20200714',
							],
							metrics: [
								{
									values: [
										'66',
										'76',
										'40.78947368421053',
										'143.02631578947367',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200715',
							],
							metrics: [
								{
									values: [
										'125',
										'139',
										'64.74820143884892',
										'82.06474820143885',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200716',
							],
							metrics: [
								{
									values: [
										'51',
										'63',
										'44.44444444444444',
										'137.61904761904762',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200717',
							],
							metrics: [
								{
									values: [
										'41',
										'44',
										'50.0',
										'202.54545454545453',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200718',
							],
							metrics: [
								{
									values: [
										'18',
										'19',
										'47.368421052631575',
										'51.73684210526316',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200719',
							],
							metrics: [
								{
									values: [
										'17',
										'19',
										'36.84210526315789',
										'38.421052631578945',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200720',
							],
							metrics: [
								{
									values: [
										'35',
										'40',
										'47.5',
										'59.325',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200721',
							],
							metrics: [
								{
									values: [
										'120',
										'124',
										'66.12903225806451',
										'65.89516129032258',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200722',
							],
							metrics: [
								{
									values: [
										'82',
										'88',
										'65.9090909090909',
										'127.2159090909091',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200723',
							],
							metrics: [
								{
									values: [
										'70',
										'86',
										'61.627906976744185',
										'73.98837209302326',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200724',
							],
							metrics: [
								{
									values: [
										'57',
										'61',
										'63.934426229508205',
										'106.19672131147541',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200725',
							],
							metrics: [
								{
									values: [
										'17',
										'17',
										'52.94117647058824',
										'73.29411764705883',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200726',
							],
							metrics: [
								{
									values: [
										'20',
										'22',
										'54.54545454545454',
										'14.772727272727273',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200727',
							],
							metrics: [
								{
									values: [
										'77',
										'91',
										'46.15384615384615',
										'131.9010989010989',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200728',
							],
							metrics: [
								{
									values: [
										'75',
										'86',
										'58.139534883720934',
										'128.30232558139534',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200729',
							],
							metrics: [
								{
									values: [
										'83',
										'91',
										'61.53846153846154',
										'92.35164835164835',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200730',
							],
							metrics: [
								{
									values: [
										'68',
										'77',
										'58.44155844155844',
										'56.688311688311686',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200731',
							],
							metrics: [
								{
									values: [
										'48',
										'56',
										'44.642857142857146',
										'92.89285714285714',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200801',
							],
							metrics: [
								{
									values: [
										'20',
										'20',
										'40.0',
										'138.5',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200802',
							],
							metrics: [
								{
									values: [
										'21',
										'25',
										'44.0',
										'141.88',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200803',
							],
							metrics: [
								{
									values: [
										'61',
										'63',
										'57.14285714285714',
										'103.84126984126983',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200804',
							],
							metrics: [
								{
									values: [
										'83',
										'92',
										'58.69565217391305',
										'99.15217391304348',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200805',
							],
							metrics: [
								{
									values: [
										'82',
										'89',
										'67.41573033707866',
										'78.29213483146067',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200806',
							],
							metrics: [
								{
									values: [
										'91',
										'96',
										'82.29166666666666',
										'26.229166666666668',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200807',
							],
							metrics: [
								{
									values: [
										'61',
										'62',
										'67.74193548387096',
										'93.61290322580645',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200808',
							],
							metrics: [
								{
									values: [
										'12',
										'13',
										'30.76923076923077',
										'121.53846153846153',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200809',
							],
							metrics: [
								{
									values: [
										'33',
										'38',
										'60.526315789473685',
										'93.44736842105263',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200810',
							],
							metrics: [
								{
									values: [
										'45',
										'50',
										'44.0',
										'162.68',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200811',
							],
							metrics: [
								{
									values: [
										'42',
										'46',
										'45.65217391304348',
										'203.65217391304347',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200812',
							],
							metrics: [
								{
									values: [
										'53',
										'60',
										'41.66666666666667',
										'66.86666666666666',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200813',
							],
							metrics: [
								{
									values: [
										'70',
										'73',
										'60.273972602739725',
										'73.45205479452055',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200814',
							],
							metrics: [
								{
									values: [
										'36',
										'39',
										'56.41025641025641',
										'152.25641025641025',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200815',
							],
							metrics: [
								{
									values: [
										'14',
										'15',
										'33.33333333333333',
										'246.73333333333332',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200816',
							],
							metrics: [
								{
									values: [
										'12',
										'13',
										'30.76923076923077',
										'405.2307692307692',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200817',
							],
							metrics: [
								{
									values: [
										'83',
										'89',
										'61.79775280898876',
										'92.43820224719101',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200818',
							],
							metrics: [
								{
									values: [
										'74',
										'82',
										'47.5609756097561',
										'210.5487804878049',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200819',
							],
							metrics: [
								{
									values: [
										'59',
										'61',
										'59.01639344262295',
										'96.29508196721312',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200820',
							],
							metrics: [
								{
									values: [
										'86',
										'92',
										'59.78260869565217',
										'99.0',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200821',
							],
							metrics: [
								{
									values: [
										'67',
										'84',
										'51.19047619047619',
										'101.03571428571429',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200822',
							],
							metrics: [
								{
									values: [
										'20',
										'22',
										'31.818181818181817',
										'250.1818181818182',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200823',
							],
							metrics: [
								{
									values: [
										'18',
										'24',
										'37.5',
										'337.8333333333333',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200824',
							],
							metrics: [
								{
									values: [
										'46',
										'53',
										'45.28301886792453',
										'83.30188679245283',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200825',
							],
							metrics: [
								{
									values: [
										'77',
										'94',
										'46.808510638297875',
										'164.87234042553192',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200826',
							],
							metrics: [
								{
									values: [
										'90',
										'96',
										'67.70833333333334',
										'210.66666666666666',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200827',
							],
							metrics: [
								{
									values: [
										'99',
										'116',
										'66.37931034482759',
										'136.32758620689654',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200828',
							],
							metrics: [
								{
									values: [
										'80',
										'87',
										'67.81609195402298',
										'100.65517241379311',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200829',
							],
							metrics: [
								{
									values: [
										'14',
										'16',
										'43.75',
										'68.3125',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200830',
							],
							metrics: [
								{
									values: [
										'17',
										'19',
										'68.42105263157895',
										'8.368421052631579',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200831',
							],
							metrics: [
								{
									values: [
										'56',
										'67',
										'56.71641791044776',
										'151.0',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200901',
							],
							metrics: [
								{
									values: [
										'60',
										'66',
										'51.515151515151516',
										'75.01515151515152',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200902',
							],
							metrics: [
								{
									values: [
										'60',
										'73',
										'58.9041095890411',
										'90.98630136986301',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200903',
							],
							metrics: [
								{
									values: [
										'69',
										'94',
										'52.12765957446809',
										'152.2340425531915',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200904',
							],
							metrics: [
								{
									values: [
										'43',
										'53',
										'39.62264150943396',
										'211.35849056603774',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200905',
							],
							metrics: [
								{
									values: [
										'22',
										'25',
										'44.0',
										'80.76',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200906',
							],
							metrics: [
								{
									values: [
										'26',
										'31',
										'58.06451612903226',
										'111.25806451612904',
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200907',
							],
							metrics: [
								{
									values: [
										'47',
										'55',
										'50.90909090909091',
										'267.07272727272726',
										'0',
									],
								},
							],
						},
					],
					totals: [
						{
							values: [
								'3019',
								'3392',
								'56.367924528301884',
								'117.57900943396227',
								'0',
							],
						},
					],
					minimums: [
						{
							values: [
								'12',
								'13',
								'30.76923076923077',
								'8.368421052631579',
								'0',
							],
						},
					],
					maximums: [
						{
							values: [
								'125',
								'139',
								'82.29166666666666',
								'405.2307692307692',
								'0',
							],
						},
					],
				},
			},
		],
	],
	referenceDate: '2020-09-08',
	options: [
		{
			compareStartDate: '2020-07-14',
			compareEndDate: '2020-08-10',
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
		},
		{
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Users',
				},
			],

		},
	],
	Component: DashboardUniqueVisitorsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Unique Visitors Widget',
	data: [
		[
			{
				nextPageToken: null,
				columnHeader: {
					dimensions: null,
					metricHeader: {
						metricHeaderEntries: [
							{
								name: 'Total Users',
								type: 'INTEGER',
							},
						],
					},
				},
				data: {
					dataLastRefreshed: null,
					isDataGolden: null,
					rowCount: 1,
					samplesReadCounts: null,
					samplingSpaceSizes: null,
					rows: [
						{
							dimensions: null,
							metrics: [
								{
									values: [
										'165',
									],
								},
								{
									values: [
										'156',
									],
								},
							],
						},
					],
					totals: [
						{
							values: [
								'165',
							],
						},
						{
							values: [
								'156',
							],
						},
					],
					minimums: [
						{
							values: [
								'165',
							],
						},
						{
							values: [
								'156',
							],
						},
					],
					maximums: [
						{
							values: [
								'165',
							],
						},
						{
							values: [
								'156',
							],
						},
					],
				},
			},
		],
		[
			{
				nextPageToken: null,
				columnHeader: {
					dimensions: [
						'ga:date',
					],
					metricHeader: {
						metricHeaderEntries: [
							{
								name: 'Users',
								type: 'INTEGER',
							},
						],
					},
				},
				data: {
					dataLastRefreshed: null,
					isDataGolden: null,
					rowCount: 28,
					samplesReadCounts: null,
					samplingSpaceSizes: null,
					rows: [
						{
							dimensions: [
								'20200813',
							],
							metrics: [
								{
									values: [
										'6',
									],
								},
							],
						},
						{
							dimensions: [
								'20200814',
							],
							metrics: [
								{
									values: [
										'3',
									],
								},
							],
						},
						{
							dimensions: [
								'20200815',
							],
							metrics: [
								{
									values: [
										'2',
									],
								},
							],
						},
						{
							dimensions: [
								'20200816',
							],
							metrics: [
								{
									values: [
										'2',
									],
								},
							],
						},
						{
							dimensions: [
								'20200817',
							],
							metrics: [
								{
									values: [
										'8',
									],
								},
							],
						},
						{
							dimensions: [
								'20200818',
							],
							metrics: [
								{
									values: [
										'15',
									],
								},
							],
						},
						{
							dimensions: [
								'20200819',
							],
							metrics: [
								{
									values: [
										'9',
									],
								},
							],
						},
						{
							dimensions: [
								'20200820',
							],
							metrics: [
								{
									values: [
										'9',
									],
								},
							],
						},
						{
							dimensions: [
								'20200821',
							],
							metrics: [
								{
									values: [
										'9',
									],
								},
							],
						},
						{
							dimensions: [
								'20200822',
							],
							metrics: [
								{
									values: [
										'5',
									],
								},
							],
						},
						{
							dimensions: [
								'20200823',
							],
							metrics: [
								{
									values: [
										'3',
									],
								},
							],
						},
						{
							dimensions: [
								'20200824',
							],
							metrics: [
								{
									values: [
										'5',
									],
								},
							],
						},
						{
							dimensions: [
								'20200825',
							],
							metrics: [
								{
									values: [
										'7',
									],
								},
							],
						},
						{
							dimensions: [
								'20200826',
							],
							metrics: [
								{
									values: [
										'12',
									],
								},
							],
						},
						{
							dimensions: [
								'20200827',
							],
							metrics: [
								{
									values: [
										'12',
									],
								},
							],
						},
						{
							dimensions: [
								'20200828',
							],
							metrics: [
								{
									values: [
										'7',
									],
								},
							],
						},
						{
							dimensions: [
								'20200829',
							],
							metrics: [
								{
									values: [
										'0',
									],
								},
							],
						},
						{
							dimensions: [
								'20200830',
							],
							metrics: [
								{
									values: [
										'2',
									],
								},
							],
						},
						{
							dimensions: [
								'20200831',
							],
							metrics: [
								{
									values: [
										'4',
									],
								},
							],
						},
						{
							dimensions: [
								'20200901',
							],
							metrics: [
								{
									values: [
										'5',
									],
								},
							],
						},
						{
							dimensions: [
								'20200902',
							],
							metrics: [
								{
									values: [
										'6',
									],
								},
							],
						},
						{
							dimensions: [
								'20200903',
							],
							metrics: [
								{
									values: [
										'10',
									],
								},
							],
						},
						{
							dimensions: [
								'20200904',
							],
							metrics: [
								{
									values: [
										'7',
									],
								},
							],
						},
						{
							dimensions: [
								'20200905',
							],
							metrics: [
								{
									values: [
										'3',
									],
								},
							],
						},
						{
							dimensions: [
								'20200906',
							],
							metrics: [
								{
									values: [
										'3',
									],
								},
							],
						},
						{
							dimensions: [
								'20200907',
							],
							metrics: [
								{
									values: [
										'4',
									],
								},
							],
						},
						{
							dimensions: [
								'20200908',
							],
							metrics: [
								{
									values: [
										'12',
									],
								},
							],
						},
						{
							dimensions: [
								'20200909',
							],
							metrics: [
								{
									values: [
										'18',
									],
								},
							],
						},
					],
					totals: [
						{
							values: [
								'188',
							],
						},
					],
					minimums: [
						{
							values: [
								'0',
							],
						},
					],
					maximums: [
						{
							values: [
								'18',
							],
						},
					],
				},
			},
		],
	],
	referenceDate: '2020-09-08',
	options: [
		{
			compareStartDate: '2020-07-14',
			compareEndDate: '2020-08-10',
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			url: 'https://www.example.com/example-page/',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Total Users',
				},
			],
		},
		{
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			url: 'https://www.example.com/example-page/',
			dimensions: 'ga:date',
			metrics: [
				{
					expression: 'ga:users',
					alias: 'Users',
				},
			],

		},
	],
	Component: DashboardUniqueVisitorsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Popular Pages Widget',
	data: [
		{
			nextPageToken: '10',
			columnHeader: {
				dimensions: [
					'ga:pageTitle',
					'ga:pagePath',
				],
				metricHeader: {
					metricHeaderEntries: [
						{
							name: 'Pageviews',
							type: 'INTEGER',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 177,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'Site Kit Test 1',
							'/',
						],
						metrics: [
							{
								values: [
									'1469',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Test 2',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'616',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Test 3',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'302',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Test 4',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'231',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 5',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'203',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 6',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'110',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 7',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'98',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 8',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'78',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 9',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'72',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Tests 10',
							'/site-kit-tests/',
						],
						metrics: [
							{
								values: [
									'71',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'4264',
						],
					},
				],
				minimums: [
					{
						values: [
							'1',
						],
					},
				],
				maximums: [
					{
						values: [
							'1469',
						],
					},
				],
			},
		},
	],
	referenceDate: '2020-09-10',
	options: {
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
	},
	Component: DashboardPopularPagesWidget,
	wrapWidget: false,
	setup,
} );
