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
import { getAdSenseMockResponse, provideAdSenseMockReport } from '../assets/js/modules/adsense/util/data-mock';
import { getAnalyticsMockResponse } from '../assets/js/modules/analytics/util/data-mock';

const generateAnalyticsData = makeReportDataGenerator( getAnalyticsMockResponse );
const generateAdSenseData = makeReportDataGenerator( getAdSenseMockResponse );

const dashboardSummaryOptions = [
	{
		// Custom start and end date for this widget to match data range: 'previousPeriod',
		startDate: '2020-07-18',
		endDate: '2020-08-14',
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
		],
	},
	{
		// getDateRangeDates( { offsetDays: 1 }) for 'last-28-days' and '2020-09-12'.
		startDate: '2020-08-15',
		endDate: '2020-09-11',
		metrics: [
			'ESTIMATED_EARNINGS',
			'PAGE_VIEWS_RPM',
			'IMPRESSIONS',
		],
	},
	{
		// Custom start and end date for this widget to match data range: 'this-month',
		startDate: '2020-08-15',
		endDate: '2020-09-11',
		metrics: [
			'ESTIMATED_EARNINGS',
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
	...generateAdSenseData( dashboardSummaryOptions ),
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

// These components make a simple AdSense report query to determine the
// currency that should be displayed in the report table.
const getCurrencyFromReportOptions = {
	startDate: '2020-08-15',
	endDate: '2020-09-11',
	metrics: 'ESTIMATED_EARNINGS',
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense', 'analytics' ],
	datastore: MODULES_ANALYTICS,
	group: 'AdSense Module/Components/Dashboard/Top Earning Pages Widget',
	referenceDate: '2020-09-12',
	...generateAnalyticsData( { ...topEarningPagesArgs } ),
	options: topEarningPagesArgs,
	setup: ( registry, variantName ) => {
		registry.dispatch( MODULES_ANALYTICS ).setAdsenseLinked( variantName !== 'AdSense Not Linked' );
		registry.dispatch( STORE_NAME ).receiveIsAdBlockerActive( variantName === 'Ad Blocker Active' );
		provideAdSenseMockReport( registry, getCurrencyFromReportOptions );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ getCurrencyFromReportOptions ] );
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
	setup: ( registry, variantName ) => {
		registry.dispatch( MODULES_ANALYTICS ).setAdsenseLinked( variantName !== 'AdSense Not Linked' );
		provideAdSenseMockReport( registry, getCurrencyFromReportOptions );
		registry.dispatch( STORE_NAME ).finishResolution( 'getReport', [ getCurrencyFromReportOptions ] );
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
	...generateAdSenseData( [
		{
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: '2020-10-29',
			endDate: '2020-11-25',
		},
		{
			dimensions: [
				'DATE',
			],
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: '2020-10-29',
			endDate: '2020-11-25',
		},
		{
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: '2020-10-01',
			endDate: '2020-10-28',
		},
		{
			dimensions: [
				'DATE',
			],
			metrics: [
				'ESTIMATED_EARNINGS',
				'PAGE_VIEWS_RPM',
				'IMPRESSIONS',
				'PAGE_VIEWS_CTR',
			],
			startDate: '2020-10-01',
			endDate: '2020-10-28',
		},
	] ),
	Component: ModuleOverviewWidget,
	wrapWidget: false,
} );
