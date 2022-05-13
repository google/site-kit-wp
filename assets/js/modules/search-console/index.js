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
 * Internal dependencies
 */
import { SettingsEdit, SettingsView } from './components/settings';
import DashboardPopularKeywordsWidget from './components/dashboard/DashboardPopularKeywordsWidget';
import SearchFunnelWidget from './components/dashboard/SearchFunnelWidget';
import {
	AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
} from '../../googlesitekit/widgets/default-areas';
import SearchConsoleIcon from '../../../svg/graphics/search-console.svg';
import { MODULES_SEARCH_CONSOLE } from './datastore/constants';
import { CONTEXT_MODULE_SEARCH_CONSOLE } from './constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'search-console', {
		storeName: MODULES_SEARCH_CONSOLE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		Icon: SearchConsoleIcon,
		screenWidgetContext: CONTEXT_MODULE_SEARCH_CONSOLE,
	} );
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'searchConsolePopularKeywords',
		{
			Component: DashboardPopularKeywordsWidget,
			width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
		},
		[
			AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
			AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
		]
	);

	widgets.registerWidget(
		'searchFunnel',
		{
			Component: SearchFunnelWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ 'search-console', 'analytics' ],
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);
};
