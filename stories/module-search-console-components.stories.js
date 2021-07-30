/**
 * Search Console Module Component Stories.
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
import DashboardClicksWidget from '../assets/js/modules/search-console/components/dashboard/DashboardClicksWidget';
import DashboardImpressionsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardImpressionsWidget';
import DashboardPopularKeywordsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardPopularKeywordsWidget';
import ModulePopularKeywordsWidget from '../assets/js/modules/search-console/components/module/ModulePopularKeywordsWidget';
import ModuleOverviewWidget from '../assets/js/modules/search-console/components/module/ModuleOverviewWidget';
import { STORE_NAME } from '../assets/js/modules/search-console/datastore/constants';

/**
 * Defines some additional setup for all stories.
 *
 * @since 1.19.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 */
const setup = ( registry ) => {
	registry.dispatch( STORE_NAME ).receiveGetSettings( {
		propertyID: 'https://example.com/',
	} );
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Dashboard/Clicks Widget',
	data: [
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-25',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-26',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-09-27',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-28',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-29',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-30',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-31',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-25',
			],
			position: 0,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	},
	Component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Clicks Widget',
	data: [
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-25',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-26',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-09-27',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-28',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-29',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-30',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-31',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-25',
			],
			position: 0,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
		url: 'https://example.com/example-page/',
	},
	Component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Dashboard/Impressions Widget',
	data: [
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-25',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-26',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-09-27',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-28',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-29',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-30',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-31',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-25',
			],
			position: 0,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	},
	Component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Impressions Widget',
	data: [
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-25',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-26',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-09-27',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-28',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-29',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-30',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-31',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-25',
			],
			position: 0,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
		url: 'https://example.com/example-page/',
	},
	Component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Dashboard/Popular Keywords Widget',
	data: [
		{
			clicks: 109,
			ctr: 0.1659056316590563,
			impressions: 657,
			keys: [
				'sitekit test',
			],
			position: 3.319634703196347,
		},
		{
			clicks: 39,
			ctr: 0.45348837209302323,
			impressions: 86,
			keys: [
				'sitekit test',
			],
			position: 1.197674418604651,
		},
		{
			clicks: 13,
			ctr: 0.045454545454545456,
			impressions: 286,
			keys: [
				'sitekit test',
			],
			position: 8.534965034965035,
		},
		{
			clicks: 9,
			ctr: 0.225,
			impressions: 40,
			keys: [
				'sitekit test',
			],
			position: 4.75,
		},
		{
			clicks: 8,
			ctr: 0.6153846153846154,
			impressions: 13,
			keys: [
				'sitekit test',
			],
			position: 3.5384615384615383,
		},
		{
			clicks: 6,
			ctr: 0.15789473684210525,
			impressions: 38,
			keys: [
				'sitekit test',
			],
			position: 3.0789473684210527,
		},
		{
			clicks: 5,
			ctr: 0.026041666666666668,
			impressions: 192,
			keys: [
				'sitekit test',
			],
			position: 9.09375,
		},
		{
			clicks: 3,
			ctr: 0.05357142857142857,
			impressions: 56,
			keys: [
				'sitekit test',
			],
			position: 3.9285714285714284,
		},
		{
			clicks: 3,
			ctr: 0.10714285714285714,
			impressions: 28,
			keys: [
				'sitekit test',
			],
			position: 3.8214285714285716,
		},
		{
			clicks: 3,
			ctr: 0.1875,
			impressions: 16,
			keys: [
				'sitekit test',
			],
			position: 4.25,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
	},
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Popular Keywords Widget',
	data: [
		{
			clicks: 109,
			ctr: 0.1659056316590563,
			impressions: 657,
			keys: [
				'sitekit test',
			],
			position: 3.319634703196347,
		},
		{
			clicks: 39,
			ctr: 0.45348837209302323,
			impressions: 86,
			keys: [
				'sitekit test',
			],
			position: 1.197674418604651,
		},
		{
			clicks: 13,
			ctr: 0.045454545454545456,
			impressions: 286,
			keys: [
				'sitekit test',
			],
			position: 8.534965034965035,
		},
		{
			clicks: 9,
			ctr: 0.225,
			impressions: 40,
			keys: [
				'sitekit test',
			],
			position: 4.75,
		},
		{
			clicks: 8,
			ctr: 0.6153846153846154,
			impressions: 13,
			keys: [
				'sitekit test',
			],
			position: 3.5384615384615383,
		},
		{
			clicks: 6,
			ctr: 0.15789473684210525,
			impressions: 38,
			keys: [
				'sitekit test',
			],
			position: 3.0789473684210527,
		},
		{
			clicks: 5,
			ctr: 0.026041666666666668,
			impressions: 192,
			keys: [
				'sitekit test',
			],
			position: 9.09375,
		},
		{
			clicks: 3,
			ctr: 0.05357142857142857,
			impressions: 56,
			keys: [
				'sitekit test',
			],
			position: 3.9285714285714284,
		},
		{
			clicks: 3,
			ctr: 0.10714285714285714,
			impressions: 28,
			keys: [
				'sitekit test',
			],
			position: 3.8214285714285716,
		},
		{
			clicks: 3,
			ctr: 0.1875,
			impressions: 16,
			keys: [
				'sitekit test',
			],
			position: 4.25,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
		url: 'https://example.com/example-page/',
	},
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Module Page/Overview Widget',
	data: [
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-07-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-07-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-25',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-07-26',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-09-27',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-07-28',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-29',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-30',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-07-31',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-01',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-02',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-03',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-04',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-05',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-06',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-07',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-08',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-09',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-10',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-11',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-12',
			],
			position: 0,
		},
		{
			clicks: 5,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-13',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-14',
			],
			position: 0,
		},
		{
			clicks: 3,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-15',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-16',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-17',
			],
			position: 0,
		},
		{
			clicks: 4,
			ctr: 0,
			impressions: 10,
			keys: [
				'2020-08-18',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-19',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-20',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-21',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 5,
			keys: [
				'2020-08-22',
			],
			position: 0,
		},
		{
			clicks: 0,
			ctr: 0,
			impressions: 6,
			keys: [
				'2020-08-23',
			],
			position: 0,
		},
		{
			clicks: 7,
			ctr: 0,
			impressions: 0,
			keys: [
				'2020-08-24',
			],
			position: 0,
		},
		{
			clicks: 10,
			ctr: 0,
			impressions: 2,
			keys: [
				'2020-08-25',
			],
			position: 0,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	},
	Component: ModuleOverviewWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Module Page/Popular Keywords Widget',
	data: [
		{
			clicks: 109,
			ctr: 0.1659056316590563,
			impressions: 657,
			keys: [
				'sitekit test',
			],
			position: 3.319634703196347,
		},
		{
			clicks: 39,
			ctr: 0.45348837209302323,
			impressions: 86,
			keys: [
				'sitekit test',
			],
			position: 1.197674418604651,
		},
		{
			clicks: 13,
			ctr: 0.045454545454545456,
			impressions: 286,
			keys: [
				'sitekit test',
			],
			position: 8.534965034965035,
		},
		{
			clicks: 9,
			ctr: 0.225,
			impressions: 40,
			keys: [
				'sitekit test',
			],
			position: 4.75,
		},
		{
			clicks: 8,
			ctr: 0.6153846153846154,
			impressions: 13,
			keys: [
				'sitekit test',
			],
			position: 3.5384615384615383,
		},
		{
			clicks: 6,
			ctr: 0.15789473684210525,
			impressions: 38,
			keys: [
				'sitekit test',
			],
			position: 3.0789473684210527,
		},
		{
			clicks: 5,
			ctr: 0.026041666666666668,
			impressions: 192,
			keys: [
				'sitekit test',
			],
			position: 9.09375,
		},
		{
			clicks: 3,
			ctr: 0.05357142857142857,
			impressions: 56,
			keys: [
				'sitekit test',
			],
			position: 3.9285714285714284,
		},
		{
			clicks: 3,
			ctr: 0.10714285714285714,
			impressions: 28,
			keys: [
				'sitekit test',
			],
			position: 3.8214285714285716,
		},
		{
			clicks: 3,
			ctr: 0.1875,
			impressions: 16,
			keys: [
				'sitekit test',
			],
			position: 4.25,
		},
	],
	referenceDate: '2020-08-26',
	options: {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
	},
	Component: ModulePopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );
