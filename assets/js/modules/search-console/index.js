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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SettingsEdit, SettingsView } from './components/settings';
import DashboardImpressionsWidget from './components/dashboard/DashboardImpressionsWidget';
import DashboardClicksWidget from './components/dashboard/DashboardClicksWidget';
import DashboardPopularKeywordsWidget from './components/dashboard/DashboardPopularKeywordsWidget';
import ModulePopularKeywordsWidget from './components/module/ModulePopularKeywordsWidget';
import ModuleOverviewWidget from './components/module/ModuleOverviewWidget';
import {
	AREA_DASHBOARD_ACQUISITION,
	AREA_DASHBOARD_SEARCH_FUNNEL,
	AREA_PAGE_DASHBOARD_ACQUISITION,
	AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
} from '../../googlesitekit/widgets/default-areas';
import SearchConsoleIcon from '../../../svg/search-console.svg';
import { STORE_NAME } from './datastore/constants';
import { CONTEXT_MODULE_SEARCH_CONSOLE, AREA_MODULE_SEARCH_CONSOLE_MAIN } from './constants';
import { WIDGET_AREA_STYLES } from '../../googlesitekit/widgets/datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule(
		'search-console',
		{
			storeName: STORE_NAME,
			SettingsEditComponent: SettingsEdit,
			SettingsViewComponent: SettingsView,
			Icon: SearchConsoleIcon,
			screenWidgetContext: CONTEXT_MODULE_SEARCH_CONSOLE,
		}
	);
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'searchConsoleImpressions',
		{
			Component: DashboardImpressionsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);
	widgets.registerWidget(
		'searchConsoleClicks',
		{
			Component: DashboardClicksWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 2,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);
	widgets.registerWidget(
		'searchConsolePopularKeywords',
		{
			Component: DashboardPopularKeywordsWidget,
			width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_ACQUISITION,
			AREA_PAGE_DASHBOARD_ACQUISITION,
		],
	);
	widgets.registerWidget(
		'searchConsoleModuleOverview',
		{
			Component: ModuleOverviewWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
		},
		[
			AREA_MODULE_SEARCH_CONSOLE_MAIN,
		],
	);
	widgets.registerWidgetArea(
		AREA_MODULE_SEARCH_CONSOLE_MAIN,
		{
			priority: 1,
			style: WIDGET_AREA_STYLES.BOXES,
			title: __( 'Overview', 'google-site-kit' ),
		},
		CONTEXT_MODULE_SEARCH_CONSOLE,
	);
	widgets.registerWidget(
		'searchConsoleModulePopularKeywords',
		{
			Component: ModulePopularKeywordsWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 2,
			wrapWidget: false,
		},
		[
			AREA_MODULE_SEARCH_CONSOLE_MAIN,
		],
	);
};
