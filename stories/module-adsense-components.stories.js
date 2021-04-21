/**
 * AdSense Module Component Stories.
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
import DashboardSummaryWidget from '../assets/js/modules/adsense/components/dashboard/DashboardSummaryWidget';
import DashboardTopEarningPagesWidget from '../assets/js/modules/adsense/components/dashboard/DashboardTopEarningPagesWidget';
import ModuleTopEarningPagesWidget from '../assets/js/modules/adsense/components/module/ModuleTopEarningPagesWidget';
import ModuleOverviewWidget from '../assets/js/modules/adsense/components/module/ModuleOverviewWidget';
import { STORE_NAME } from '../assets/js/modules/adsense/datastore/constants';
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import * as fixtures from '../assets/js/modules/adsense/datastore/__fixtures__';
import { getAnalyticsMockResponse } from '../assets/js/modules/analytics/util/data-mock';

const generateAnalyticsData = makeReportDataGenerator( getAnalyticsMockResponse );
const dashboardSummaryOptions = [
	{
		// Custom start and end date for this widget to match data range: 'today',
		startDate: '2020-09-12',
		endDate: '2020-09-12',
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
		// Custom start and end date for this widget to match data range: 'this-month',
		startDate: '2020-08-15',
		endDate: '2020-09-11',
		metrics: [
			'EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
		],
		dimensions: [
			'DATE',
		],
	},
];
generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense', 'analytics' ],
	datastore: STORE_NAME,
	group: 'AdSense Module/Components/Dashboard/Summary Widget',
	referenceDate: '2020-09-12',
	setup: ( { dispatch }, variantName ) => {
		dispatch( MODULES_ANALYTICS ).setAdsenseLinked( true );
		dispatch( STORE_NAME ).receiveIsAdBlockerActive( variantName === 'Ad Blocker Active' );
	},
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
	options: dashboardSummaryOptions,
	Component: DashboardSummaryWidget,
	wrapWidget: false,
	additionalVariants: {
		'Ad Blocker Active': {
			data: [],
			options: [],
		},
	},
} );

const topEarningPagesArgs = {
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
	limit: 5,
};

const topEarningPagesAdSenseReport = {
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
};

const adsenseReportOptions = {
	startDate: '2020-08-15',
	endDate: '2020-09-11',
	metrics: 'EARNINGS',
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense', 'analytics' ],
	datastore: MODULES_ANALYTICS,
	group: 'AdSense Module/Components/Dashboard/Top Earning Pages Widget',
	referenceDate: '2020-09-12',
	...generateAnalyticsData( { ...topEarningPagesArgs } ),
	options: topEarningPagesArgs,
	setup: ( { dispatch }, variantName ) => {
		dispatch( MODULES_ANALYTICS ).setAdsenseLinked( variantName !== 'AdSense Not Linked' );
		dispatch( STORE_NAME ).receiveIsAdBlockerActive( variantName === 'Ad Blocker Active' );
		dispatch( STORE_NAME ).receiveGetReport( topEarningPagesAdSenseReport, { options: adsenseReportOptions } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ adsenseReportOptions ] );
	},
	Component: DashboardTopEarningPagesWidget,
	wrapWidget: false,
	additionalVariants: {
		'AdSense Not Linked': {
			data: [],
			options: topEarningPagesArgs,
		},
		'Ad Blocker Active': {
			data: [],
			options: [],
		},
	},
} );

const moduleTopEarningPagesWidgetOptions = {
	...topEarningPagesArgs,
	limit: 10,
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense', 'analytics' ],
	datastore: MODULES_ANALYTICS,
	setup: ( { dispatch }, variantName ) => {
		dispatch( MODULES_ANALYTICS ).setAdsenseLinked( variantName !== 'AdSense Not Linked' );
		dispatch( STORE_NAME ).receiveGetReport( topEarningPagesAdSenseReport, { options: adsenseReportOptions } );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ adsenseReportOptions ] );
	},
	group: 'AdSense Module/Components/Module/Top Earning Pages Widget',
	referenceDate: '2020-09-12',
	...generateAnalyticsData( moduleTopEarningPagesWidgetOptions ),
	Component: ModuleTopEarningPagesWidget,
	wrapWidget: false,
	additionalVariants: {
		'AdSense Not Linked': {
			data: [],
			options: moduleTopEarningPagesWidgetOptions,
		},
	},
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense' ],
	datastore: STORE_NAME,
	group: 'AdSense Module/Components/Module/Overview Widget',
	referenceDate: '2020-11-25',
	data: [
		fixtures.earnings.currentStatsData,
		fixtures.earnings.prevStatsData,
		fixtures.earnings.currentSummaryData,
		fixtures.earnings.prevSummaryData,
	],
	options: [
		fixtures.earnings.currentStatsArgs,
		fixtures.earnings.prevStatsArgs,
		fixtures.earnings.currentSummaryArgs,
		fixtures.earnings.prevSummaryArgs,
	],
	Component: ModuleOverviewWidget,
	wrapWidget: false,
} );
