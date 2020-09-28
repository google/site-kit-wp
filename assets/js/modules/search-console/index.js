/**
 * Search Console module initialization.
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
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Widgets from 'googlesitekit-widgets';
import './datastore';
import { fillFilterWithComponent } from '../../util';
import { SettingsMain as SearchConsolesSettings } from './components/settings';
import DashboardImpressionsWidget from './components/dashboard/DashboardImpressionsWidget';
import DashboardClicksWidget from './components/dashboard/DashboardClicksWidget';
import DashboardPopularKeywordsWidget from './components/dashboard/DashboardPopularKeywordsWidget';
import {
	AREA_DASHBOARD_POPULARITY,
	AREA_DASHBOARD_SEARCH_FUNNEL,
	AREA_PAGE_DASHBOARD_POPULARITY,
	AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
} from '../../googlesitekit/widgets/default-areas';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

function ConnectedSearchConsoleSettings( props ) {
	return (
		<Data.RegistryProvider value={ Data }>
			<SearchConsolesSettings { ...props } />
		</Data.RegistryProvider>
	);
}

/**
 * Add components to the settings page.
 */
addFilter(
	'googlesitekit.ModuleSettingsDetails-search-console',
	'googlesitekit.SearchConsoleModuleSettingsDetails',
	fillFilterWithComponent( ConnectedSearchConsoleSettings, {
		onSettingsPage: true,
	} )
);

domReady( () => {
	Widgets.registerWidget(
		'searchConsoleImpressions',
		{
			component: DashboardImpressionsWidget,
			width: Widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);
	Widgets.registerWidget(
		'searchConsoleClicks',
		{
			component: DashboardClicksWidget,
			width: Widgets.WIDGET_WIDTHS.QUARTER,
			priority: 2,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);
	Widgets.registerWidget(
		'searchConsolePopularKeywords',
		{
			component: DashboardPopularKeywordsWidget,
			width: Widgets.WIDGET_WIDTHS.HALF,
			priority: 1,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_POPULARITY,
			AREA_PAGE_DASHBOARD_POPULARITY,
		],
	);
} );
