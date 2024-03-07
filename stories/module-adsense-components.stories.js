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
import {
	generateReportBasedWidgetStories,
	makeReportDataGenerator,
} from './utils/generate-widget-stories';
import { zeroing } from './utils/adsense-data-zeroing';
import DashboardTopEarningPagesWidgetGA4 from '../assets/js/modules/adsense/components/dashboard/DashboardTopEarningPagesWidgetGA4';
import ModuleOverviewWidget from '../assets/js/modules/adsense/components/module/ModuleOverviewWidget';
import { MODULES_ADSENSE } from '../assets/js/modules/adsense/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import {
	getAdSenseMockResponse,
	provideAdSenseMockReport,
} from '../assets/js/modules/adsense/util/data-mock';
import { getAnalytics4MockResponse } from '../assets/js/modules/analytics-4/utils/data-mock';

const generateAnalyticsData = makeReportDataGenerator(
	getAnalytics4MockResponse
);
const generateAdSenseData = makeReportDataGenerator( getAdSenseMockResponse );

// @TODO: Update it to GA4.
const topEarningPagesArgs = {
	startDate: '2020-08-15',
	endDate: '2020-09-11',
	dimensions: [ 'pageTitle', 'pagePath' ],
	metrics: [ { name: 'totalAdRevenue' } ],
	orderBys: [ { metric: { metricName: 'totalAdRevenue' } } ],
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
	moduleSlugs: [ 'adsense', 'analytics-4' ],
	datastore: MODULES_ANALYTICS_4,
	group: 'AdSense Module/Components/Dashboard/Top Earning Pages Widget',
	referenceDate: '2020-09-12',
	...generateAnalyticsData( { ...topEarningPagesArgs } ),
	options: topEarningPagesArgs,
	setup: ( registry, variantName ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAdsenseLinked( variantName !== 'AdSense Not Linked' );
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveIsAdBlockerActive( variantName === 'Ad Blocker Active' );
		provideAdSenseMockReport( registry, getCurrencyFromReportOptions );
		registry
			.dispatch( MODULES_ADSENSE )
			.finishResolution( 'getReport', [ getCurrencyFromReportOptions ] );
	},
	Component: DashboardTopEarningPagesWidgetGA4,
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

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'adsense' ],
	datastore: MODULES_ADSENSE,
	group: 'AdSense Module/Components/Module/Overview Widget',
	referenceDate: '2020-11-25',
	zeroing,
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
			dimensions: [ 'DATE' ],
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
			dimensions: [ 'DATE' ],
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
	additionalVariants: {
		// We are disabling this variant because it is not needed for AdSense module.
		DataUnavailable: false,
	},
	Component: ModuleOverviewWidget,
	wrapWidget: false,
} );
