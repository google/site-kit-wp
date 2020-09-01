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

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createAddToFilter } from '../../util/helpers';

const slug = 'search-console';

const addGoogleSitekitSearchConsoleDashboardWidget = createAddToFilter( <GoogleSitekitSearchConsoleDashboardWidget /> );
const addGoogleSitekitSearchConsoleAdminbarWidget = createAddToFilter( <GoogleSitekitSearchConsoleAdminbarWidget /> );
const addWPSearchConsoleDashboardWidget = createAddToFilter( <WPSearchConsoleDashboardWidget /> );
const addDashboardSearchFunnel = createAddToFilter( <DashboardSearchFunnel /> );
const addSearchConsoleDashboardWidgetTopLevel = createAddToFilter( <SearchConsoleDashboardWidgetTopLevel /> );

const addDashboardDetailsSearchFunnel = createAddToFilter( <DashboardDetailsWidgetSearchFunnel /> );
const addDashboardDetailsKeywords = createAddToFilter( <DashboardDetailsWidgetKeywordsTable /> );
const addDashboardPopularKeywords = createAddToFilter( <DashboardWidgetPopularKeywordsTable /> );
const addDashboardPopularity = createAddToFilter( <DashboardPopularity /> );
const addPostSearcher = createAddToFilter( <PostSearcher /> );

/**
 * Internal dependencies
 */
import PostSearcher from '../../components/PostSearcher';
import GoogleSitekitSearchConsoleDashboardWidget from './components/dashboard/GoogleSitekitSearchConsoleDashboardWidget';
import GoogleSitekitSearchConsoleAdminbarWidget from './components/adminbar/GoogleSitekitSearchConsoleAdminbarWidget';
import WPSearchConsoleDashboardWidget from './components/wp-dashboard/WPSearchConsoleDashboardWidget';
import DashboardSearchFunnel from './components/dashboard/DashboardSearchFunnel.js';
import SearchConsoleDashboardWidgetTopLevel from './components/dashboard/SearchConsoleDashboardWidgetTopLevel';
import DashboardDetailsWidgetKeywordsTable from './components/dashboard-details/DashboardDetailsWidgetKeywordsTable';
import DashboardWidgetPopularKeywordsTable from './components/dashboard/DashboardWidgetPopularKeywordsTable';
import DashboardDetailsWidgetSearchFunnel from './components/dashboard-details/DashboardDetailsSearchFunnel';
import DashboardPopularity from './components/dashboard/DashboardPopularity';

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
addFilter( 'googlesitekit.DashboardDetailsModule',
	'googlesitekit.SearchConsole',
	addDashboardDetailsKeywords, 40 );

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
