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
import DashboardClicksWidget from '../assets/js/modules/search-console/components/dashboard/DashboardClicksWidget';
import DashboardImpressionsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardImpressionsWidget';
import DashboardPopularKeywordsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardPopularKeywordsWidget';
import ModulePopularKeywordsWidget from '../assets/js/modules/search-console/components/module/ModulePopularKeywordsWidget';
import ModuleOverviewWidget from '../assets/js/modules/search-console/components/module/ModuleOverviewWidget';
import { MODULES_SEARCH_CONSOLE } from '../assets/js/modules/search-console/datastore/constants';
import { getSearchConsoleMockResponse } from '../assets/js/modules/search-console/util/data-mock';
import {
	generateReportBasedWidgetStories,
	makeReportDataGenerator,
} from './utils/generate-widget-stories';

const generateSearchConsoleData = makeReportDataGenerator(
	getSearchConsoleMockResponse
);

/**
 * Defines some additional setup for all stories.
 *
 * @since 1.19.0
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 */
const setup = ( registry ) => {
	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
		propertyID: 'https://example.com/',
	} );
};

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Dashboard/Clicks Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	} ),
	Component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Page Dashboard/Clicks Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
		url: 'https://example.com/example-page/',
	} ),
	Component: DashboardClicksWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Dashboard/Impressions Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	} ),
	Component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Page Dashboard/Impressions Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
		url: 'https://example.com/example-page/',
	} ),
	Component: DashboardImpressionsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Dashboard/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
	} ),
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group:
		'Search Console Module/Components/Page Dashboard/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
		url: 'https://example.com/example-page/',
	} ),
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group: 'Search Console Module/Components/Module Page/Overview Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		dimensions: 'date',
		startDate: '2020-07-01',
		endDate: '2020-08-25',
	} ),
	Component: ModuleOverviewWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlugs: [ 'search-console' ],
	datastore: MODULES_SEARCH_CONSOLE,
	group:
		'Search Console Module/Components/Module Page/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( {
		startDate: '2020-07-29',
		endDate: '2020-08-25',
		dimensions: 'query',
		limit: 10,
	} ),
	Component: ModulePopularKeywordsWidget,
	wrapWidget: false,
	setup,
} );
