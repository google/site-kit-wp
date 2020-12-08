/**
 * AdSense Module Component Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import DashboardSummaryWidget from '../assets/js/modules/adsense/components/dashboard/DashboardSummaryWidget';
import DashboardTopEarningPagesWidget from '../assets/js/modules/adsense/components/dashboard/DashboardTopEarningPagesWidget';
import { STORE_NAME } from '../assets/js/modules/adsense/datastore/constants';
import { STORE_NAME as ANALYTICS_STORE } from '../assets/js/modules/analytics/datastore/constants';

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense' ],
	datastore: STORE_NAME,
	group: 'AdSense Module/Components/Dashboard/Summary Widget',
	referenceDate: '2020-09-12',
	data: [
		{
			kind: 'adsense#report',
			totalMatchedRows: '1',
			headers: [
				{
					name: 'EARNINGS',
					type: 'METRIC_CURRENCY',
					currency: 'USD',
				},
				{
					name: 'PAGE_VIEWS_RPM',
					type: 'METRIC_CURRENCY',
					currency: 'USD',
				},
				{
					name: 'IMPRESSIONS',
					type: 'METRIC_TALLY',
				},
			],
			rows: [
				[
					'6.13',
					'2.98',
					'226791',
				],
			],
			totals: [
				'6.13',
				'2.98',
				'226791',
			],
			averages: [
				'6.13',
				null,
				'226791',
			],
			startDate: '2020-09-12',
			endDate: '2020-09-12',
		},
		{
			kind: 'adsense#report',
			totalMatchedRows: '1',
			headers: [
				{ name: 'EARNINGS', type: 'METRIC_CURRENCY', currency: 'USD' },
				{ name: 'PAGE_VIEWS_RPM', type: 'METRIC_CURRENCY', currency: 'USD' },
				{ name: 'IMPRESSIONS', type: 'METRIC_TALLY' },
			],
			rows: [
				[ '2103.23', '1.89', '5693093' ],
			],
			totals: [
				'2103.23', '1.89', '5693093' ],
			averages: [
				'2103.23', null, '5693093',
			],
			startDate: '2020-08-15',
			endDate: '2020-09-11',
		},
		{
			kind: 'adsense#report',
			totalMatchedRows: '32',
			headers: [
				{ name: 'DATE', type: 'DIMENSION' },
				{ name: 'EARNINGS', type: 'METRIC_CURRENCY', currency: 'USD' },
				{ name: 'PAGE_VIEWS_RPM', type: 'METRIC_CURRENCY', currency: 'USD' },
				{ name: 'IMPRESSIONS', type: 'METRIC_TALLY' },
			],
			rows: [
				[ '2020-09-01', '18.08', '3.98', '1278373' ],
				[ '2020-09-02', '27.02', '3.39', '1307556' ],
				[ '2020-09-03', '35.05', '3.69', '1491923' ],
				[ '2020-09-04', '45.43', '3.72', '1244807' ],
				[ '2020-09-05', '44.44', '4.36', '971017' ],
				[ '2020-09-06', '40.37', '3.77', '1014415' ],
				[ '2020-09-07', '36.09', '3.35', '1509543' ],
				[ '2020-09-08', '22.19', '2.96', '1591345' ],
				[ '2020-09-09', '25.53', '3.11', '1494963' ],
				[ '2020-09-10', '18.80', '3.23', '1249817' ],
				[ '2020-09-11', '5.77', '2.88', '330158' ],
				[ '2020-09-12', '6.13', '2.98', '226791' ],
			],
			totals: [ '', '324.90', '3.45', '12465901' ],
			averages: [ '', '27.08', null, '1038825' ],
			startDate: '2020-09-01',
			endDate: '2020-09-12',
		},
	],
	options: [
		{
			dateRange: 'today',
			metrics: [
				'EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
			],
		},
		{
			// getDateRangeDates( { offsetDays: 1 }) for 'last-28-days' and '2020-09-12'.
			startDate: '2020-08-15',
			endDate: '2020-09-11',
			metrics: [
				'EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
			],
		},
		{
			dateRange: 'this-month',
			metrics: [
				'EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
			],
			dimensions: [
				'DATE',
			],
		},
	],
	Component: DashboardSummaryWidget,
	wrapWidget: false,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense', 'analytics' ],
	datastore: ANALYTICS_STORE,
	group: 'AdSense Module/Components/Dashboard/Top Earning Pages Widget',
	referenceDate: '2020-09-12',
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
							name: 'Earnings',
							type: 'CURRENCY',
						},
						{
							name: 'Page RPM',
							type: 'CURRENCY',
						},
						{
							name: 'Impressions',
							type: 'INTEGER',
						},
					],
				},
			},
			data: {
				dataLastRefreshed: null,
				isDataGolden: null,
				rowCount: 316,
				samplesReadCounts: null,
				samplingSpaceSizes: null,
				rows: [
					{
						dimensions: [
							'Site Kit Top Earning Page 1',
							'/',
						],
						metrics: [
							{
								values: [
									'0.76352',
									'0.6059682539682539',
									'499',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 2',
							'/site-kit-top-earning-page-2/',
						],
						metrics: [
							{
								values: [
									'0.371714',
									'10.32538888888889',
									'38',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 3',
							'/site-kit-top-earning-page-3/',
						],
						metrics: [
							{
								values: [
									'0.286556',
									'0.8790061349693251',
									'825',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 4',
							'/site-kit-top-earning-page-4/',
						],
						metrics: [
							{
								values: [
									'0.212868',
									'5.60178947368421',
									'68',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 5',
							'/site-kit-top-earning-page-5/',
						],
						metrics: [
							{
								values: [
									'0.152164',
									'15.2164',
									'22',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 6',
							'/site-kit-top-earning-page-6/',
						],
						metrics: [
							{
								values: [
									'0.036977',
									'0.33015178571428566',
									'144',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 7',
							'/site-kit-top-earning-page-7/',
						],
						metrics: [
							{
								values: [
									'0.029555',
									'0.29555',
									'206',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 8',
							'/site-kit-top-earning-page-8/',
						],
						metrics: [
							{
								values: [
									'0.028485',
									'1.0173214285714285',
									'35',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 9',
							'/site-kit-top-earning-page-9/',
						],
						metrics: [
							{
								values: [
									'0.024269',
									'0.3677121212121212',
									'81',
								],
							},
						],
					},
					{
						dimensions: [
							'Site Kit Top Earning Page 10',
							'/site-kit-top-earning-page-10/',
						],
						metrics: [
							{
								values: [
									'0.019556',
									'1.777818181818182',
									'13',
								],
							},
						],
					},
				],
				totals: [
					{
						values: [
							'2.150211',
							'0.6847805732484076',
							'4304',
						],
					},
				],
				minimums: [
					{
						values: [
							'0.0',
							'0.0',
							'1',
						],
					},
				],
				maximums: [
					{
						values: [
							'0.76352',
							'15.2164',
							'825',
						],
					},
				],
			},
		},
	],
	options: {
		// getDateRangeDates( { offsetDays: 1 }) for 'last-28-days' and '2020-09-12'.
		startDate: '2020-08-15',
		endDate: '2020-09-11',
		dimensions: [ 'ga:pageTitle', 'ga:pagePath' ],
		metrics: [
			{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
			{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
			{ expression: 'ga:adsensePageImpressions', alias: 'Impressions' },
		],
		orderby: {
			fieldName: 'ga:adsenseRevenue',
			sortOrder: 'DESCENDING',
		},
		limit: 10,
	},
	Component: DashboardTopEarningPagesWidget,
	wrapWidget: false,
	additionalVariants: {
		'AdSense Not Linked': {
			data: [],
			options: {
				// getDateRangeDates( { offsetDays: 1 }) for 'last-28-days' and '2020-09-12'.
				startDate: '2020-08-15',
				endDate: '2020-09-11',
				dimensions: [ 'ga:pageTitle', 'ga:pagePath' ],
				metrics: [
					{ expression: 'ga:adsenseRevenue', alias: 'Earnings' },
					{ expression: 'ga:adsenseECPM', alias: 'Page RPM' },
					{ expression: 'ga:adsensePageImpressions', alias: 'Impressions' },
				],
				orderby: {
					fieldName: 'ga:adsenseRevenue',
					sortOrder: 'DESCENDING',
				},
				limit: 10,
			},
		},
	},
	additionalVariantCallbacks: {
		Loaded: ( dispatch ) => dispatch( ANALYTICS_STORE ).setAdsenseLinked( true ),
		'Data Unavailable': ( dispatch ) => dispatch( ANALYTICS_STORE ).setAdsenseLinked( true ),
		Error: ( dispatch ) => dispatch( ANALYTICS_STORE ).setAdsenseLinked( true ),
	},
} );
