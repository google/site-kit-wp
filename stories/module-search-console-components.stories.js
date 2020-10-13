/**
 * Search Console Module Component Stories.
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
import DashboardClicksWidget from '../assets/js/modules/search-console/components/dashboard/DashboardClicksWidget';
import DashboardImpressionsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardImpressionsWidget';
import DashboardPopularKeywordsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardPopularKeywordsWidget';
import { STORE_NAME } from '../assets/js/modules/search-console/datastore/constants';
import {
	clicksAndImpressionsWidgetData,
	dashboardClicksWidgetArgs,
	dashboardImpressionsWidgetArgs,
	pageDashboardClicksWidgetArgs,
	pageDashboardImpressionsArgs,
	pageDashboardPopularKeyWordsWidgetArgs,
	pageDashboardPopularKeyWordsWidgetData,
	dashboardPopularKeyWordsWidgetArgs,
	dashboardPopularKeyWordsWidgetData,
} from '../assets/js/modules/search-console/datastore/__fixtures__';

/**
 * Defines some additional setup for all stories.
 *
 * @since n.e.x.t
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
	data: clicksAndImpressionsWidgetData,
	options: dashboardClicksWidgetArgs,
	component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Clicks Widget',
	data: clicksAndImpressionsWidgetData,
	options: pageDashboardClicksWidgetArgs,
	component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Dashboard/Impressions Widget',
	data: clicksAndImpressionsWidgetData,
	options: dashboardImpressionsWidgetArgs,
	component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Impressions Widget',
	data: clicksAndImpressionsWidgetData,
	options: pageDashboardImpressionsArgs,
	component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Dashboard/Popular Keywords Widget',
	data: dashboardPopularKeyWordsWidgetData,
	options: dashboardPopularKeyWordsWidgetArgs,
	component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: STORE_NAME,
	group: 'Search Console Module/Components/Page Dashboard/Popular Keywords Widget',
	data: pageDashboardPopularKeyWordsWidgetData,
	options: pageDashboardPopularKeyWordsWidgetArgs,
	component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );
