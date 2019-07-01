/**
 * Search Console module initialization.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import GoogleSitekitSearchConsoleDashboardWidget from './dashboard/dashboard-widget';
import GoogleSitekitSearchConsoleAdminbarWidget from './adminbar/adminbar-widget';
import WPSearchConsoleDashboardWidget from './wp-dashboard/wp-dashboard-widget';
import DashboardSearchFunnel from './dashboard/dashboard-widget-search-funnel.js';
import SearchConsoleDashboardWidgetTopLevel from './dashboard/dashboard-widget-top-level';
import DashboardDetailsWidgetKeywordsTable from './dashboard-details/dashboard-details-widget-keyword-table';
import DashboardWidgetPopularKeywordsTable from './dashboard/dashboard-widget-popular-keyword-table';
import DashboardDetailsWidgetSearchFunnel from './dashboard-details/dashboard-details-widget-search-funnel';
import DashboardPopularity from './dashboard/dashboard-widget-popularity';
import PostSearcher from 'GoogleComponents/post-searcher';
import SearchConsoleSettingStatus from './settings/search-console-settings-status';

import { createAddToFilter } from 'GoogleUtil/helpers';
import { fillFilterWithComponent } from 'GoogleUtil';

const { addFilter } = wp.hooks;

const slug = 'search-console';

const addGoogleSitekitSearchConsoleDashboardWidget = createAddToFilter( <GoogleSitekitSearchConsoleDashboardWidget /> );
const addGoogleSitekitSearchConsoleAdminbarWidget  = createAddToFilter( <GoogleSitekitSearchConsoleAdminbarWidget /> );
const addWPSearchConsoleDashboardWidget            = createAddToFilter( <WPSearchConsoleDashboardWidget /> );
const addDashboardSearchFunnel                     = createAddToFilter( <DashboardSearchFunnel /> );
const addSearchConsoleDashboardWidgetTopLevel      = createAddToFilter( <SearchConsoleDashboardWidgetTopLevel /> );

const addDashboardDetailsSearchFunnel              = createAddToFilter( <DashboardDetailsWidgetSearchFunnel /> );
const addDashboardDetailsKeywords                  = createAddToFilter( <DashboardDetailsWidgetKeywordsTable /> );
const addDashboardPopularKeywords                  = createAddToFilter( <DashboardWidgetPopularKeywordsTable /> );
const addDashboardPopularity                       = createAddToFilter( <DashboardPopularity /> );
const addPostSearcher                              = createAddToFilter( <PostSearcher /> );

/**
 * Add components to the settings page.
 */
addFilter( `googlesitekit.ModuleSettingsDetails-${slug}`,
	'googlesitekit.SearchConsoleModuleSettingsDetails',
	fillFilterWithComponent( SearchConsoleSettingStatus, {
		onSettingsPage: true,
	} ) );


/**
* Add components to the Site Kit Dashboard.
*/
addFilter( 'googlesitekit.DashboardModule',
	'googlesitekit.SearchConsole',
	addDashboardSearchFunnel, 11 );
addFilter( 'googlesitekit.DashboardModule',
	'googlesitekit.DashboardPopularityModule',
	addDashboardPopularity, 40 );
addFilter( 'googlesitekit.DashboardSearchFunnel',
	'googlesitekit.SearchConsoleSearchFunnel',
	addSearchConsoleDashboardWidgetTopLevel );

/**
* Add components to the Site Kit URL Details Dashboard.
*/
addFilter( 'googlesitekit.DashboardDetailsModule',
	'googlesitekit.SearchConsole',
	addDashboardDetailsSearchFunnel );

if ( ! googlesitekit.permaLink ) {
	addFilter( 'googlesitekit.DashboardDetailsModule',
		'googlesitekit.SearchConsole',
		addDashboardDetailsKeywords, 40 );
}

addFilter( 'googlesitekit.DashboardPopularity',
	'googlesitekit.SearchConsoleDashboardPopularity',
	addDashboardPopularKeywords );
addFilter( 'googlesitekit.DashboardPopularity',
	'googlesitekit.DashboardPPostSearcherModule',
	addPostSearcher, 30 );

/**
 * Add components to the WordPress Dashboard widget.
*/
addFilter( 'googlesitekit.WPDashboardHeader',
	'googlesitekit.SearchConsole',
	addWPSearchConsoleDashboardWidget, 11 );

/**
 * Add components to the module detail page.
 */
addFilter( 'googlesitekit.ModuleApp-' + slug,
	'googlesitekit.ModuleApp',
	addGoogleSitekitSearchConsoleDashboardWidget );

addFilter( `googlesitekit.showDateRangeSelector-${ slug }`,
	'googlesitekit.searchConsoleShowDateRangeSelector',
	() => true );

/**
 * Add components to the adminbar.
 */
addFilter( 'googlesitekit.AdminbarModules',
	'googlesitekit.SearchConsole',
	addGoogleSitekitSearchConsoleAdminbarWidget );
