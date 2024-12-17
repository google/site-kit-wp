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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '../assets/js/googlesitekit/constants';
import DashboardPopularKeywordsWidget from '../assets/js/modules/search-console/components/dashboard/DashboardPopularKeywordsWidget';
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

function generateSearchConsoleWidgetStories( args ) {
	generateReportBasedWidgetStories( {
		moduleSlugs: [ 'search-console' ],
		datastore: MODULES_SEARCH_CONSOLE,
		setup,
		zeroing( report, options ) {
			if ( options.dimensions === 'query' ) {
				return [];
			}

			return report.map( ( row ) => ( {
				...row,
				clicks: 0,
				ctr: 0,
				impressions: 0,
				position: 0,
			} ) );
		},
		...args,
	} );
}

generateSearchConsoleWidgetStories( {
	group: 'Legacy/Search Console Module/Components/Dashboard/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( [
		{
			startDate: '2020-07-29',
			endDate: '2020-08-25',
			dimensions: 'query',
			limit: 10,
		},
		{
			dimensions: 'date',
			startDate: '2020-07-01',
			endDate: '2020-08-25',
		},
	] ),
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
} );

generateSearchConsoleWidgetStories( {
	group: 'Legacy/Search Console Module/Components/Entity Dashboard/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( [
		{
			startDate: '2020-07-29',
			endDate: '2020-08-25',
			dimensions: 'query',
			limit: 10,
			url: 'https://example.com/example-page/',
		},
		{
			dimensions: 'date',
			startDate: '2020-07-01',
			endDate: '2020-08-25',
			url: 'https://example.com/example-page/',
		},
	] ),
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
} );

generateSearchConsoleWidgetStories( {
	group: 'Legacy/Search Console Module/Components/View Only Dashboard/Popular Keywords Widget',
	referenceDate: '2020-08-26',
	...generateSearchConsoleData( [
		{
			startDate: '2020-07-29',
			endDate: '2020-08-25',
			dimensions: 'query',
			limit: 10,
			url: 'https://example.com/example-page/',
		},
		{
			dimensions: 'date',
			startDate: '2020-07-01',
			endDate: '2020-08-25',
			url: 'https://example.com/example-page/',
		},
	] ),
	Component: DashboardPopularKeywordsWidget,
	wrapWidget: false,
	viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} );
