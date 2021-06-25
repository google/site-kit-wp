/**
 * Search Console module initialization.
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
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createAddToFilter } from '../../util/helpers';
import PostSearcher from '../../components/PostSearcher';
import GoogleSitekitSearchConsoleDashboardWidget from './components/dashboard/GoogleSitekitSearchConsoleDashboardWidget';

const slug = 'search-console';

const addGoogleSitekitSearchConsoleDashboardWidget = createAddToFilter( <GoogleSitekitSearchConsoleDashboardWidget /> );

const addPostSearcher = createAddToFilter( <PostSearcher /> );

/**
 * Add components to the Site Kit Dashboard.
 */
addFilter( 'googlesitekit.DashboardPopularity',
	'googlesitekit.DashboardPPostSearcherModule',
	addPostSearcher, 30 );

/**
 * Add components to the module detail page.
 */
addFilter( 'googlesitekit.ModuleApp-' + slug,
	'googlesitekit.ModuleApp',
	addGoogleSitekitSearchConsoleDashboardWidget );

addFilter( `googlesitekit.showDateRangeSelector-${ slug }`,
	'googlesitekit.searchConsoleShowDateRangeSelector',
	() => true );
