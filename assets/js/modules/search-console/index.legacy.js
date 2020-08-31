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
import PostSearcher from '../../components/PostSearcher';
import GoogleSitekitSearchConsoleDashboardWidget from './components/dashboard/GoogleSitekitSearchConsoleDashboardWidget';
import GoogleSitekitSearchConsoleAdminbarWidget from './components/adminbar/GoogleSitekitSearchConsoleAdminbarWidget';
import WPSearchConsoleDashboardWidget from './components/wp-dashboard/WPSearchConsoleDashboardWidget';
import LegacyDashboardSearchFunnel from './components/dashboard/LegacyDashboardSearchFunnel.js';
import LegacySearchConsoleDashboardWidgetTopLevel from './components/dashboard/LegacySearchConsoleDashboardWidgetTopLevel';
import DashboardDetailsWidgetKeywordsTable from './components/dashboard-details/DashboardDetailsWidgetKeywordsTable';
import LegacyDashboardWidgetPopularKeywordsTable from './components/dashboard/LegacyDashboardWidgetPopularKeywordsTable';
import DashboardDetailsWidgetSearchFunnel from './components/dashboard-details/DashboardDetailsSearchFunnel';
import LegacyDashboardPopularity from './components/dashboard/LegacyDashboardPopularity';

const slug = 'search-console';

const addGoogleSitekitSearchConsoleDashboardWidget = createAddToFilter( <GoogleSitekitSearchConsoleDashboardWidget /> );
const addGoogleSitekitSearchConsoleAdminbarWidget = createAddToFilter( <GoogleSitekitSearchConsoleAdminbarWidget /> );
const addWPSearchConsoleDashboardWidget = createAddToFilter( <WPSearchConsoleDashboardWidget /> );
const addLegacyDashboardSearchFunnel = createAddToFilter( <LegacyDashboardSearchFunnel /> );
const addLegacySearchConsoleDashboardWidgetTopLevel = createAddToFilter( <LegacySearchConsoleDashboardWidgetTopLevel /> );

const addDashboardDetailsSearchFunnel = createAddToFilter( <DashboardDetailsWidgetSearchFunnel /> );
const addDashboardDetailsKeywords = createAddToFilter( <DashboardDetailsWidgetKeywordsTable /> );
const addLegacyDashboardWidgetPopularKeywordsTable = createAddToFilter( <LegacyDashboardWidgetPopularKeywordsTable /> );
const addLegacyDashboardPopularity = createAddToFilter( <LegacyDashboardPopularity /> );
const addPostSearcher = createAddToFilter( <PostSearcher /> );

/**
 * Add components to the Site Kit Dashboard.
 */
addFilter( 'googlesitekit.DashboardModule',
	'googlesitekit.SearchConsole',
	addLegacyDashboardSearchFunnel, 11 );
addFilter( 'googlesitekit.DashboardModule',
	'googlesitekit.DashboardPopularityModule',
	addLegacyDashboardPopularity, 40 );
addFilter( 'googlesitekit.DashboardSearchFunnel',
	'googlesitekit.SearchConsoleSearchFunnel',
	addLegacySearchConsoleDashboardWidgetTopLevel );

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
	addLegacyDashboardWidgetPopularKeywordsTable );
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
