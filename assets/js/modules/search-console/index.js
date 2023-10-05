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
import SearchFunnelWidgetGA4 from './components/dashboard/SearchFunnelWidgetGA4';
import {
	AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
} from '../../googlesitekit/widgets/default-areas';
import SearchConsoleIcon from '../../../svg/graphics/search-console.svg';
import { MODULES_SEARCH_CONSOLE } from './datastore/constants';
import PopularKeywordsWidget from './components/widgets/PopularKeywordsWidget';
import { isFeatureEnabled } from '../../features';
import { negateDefined } from '../../util/negate';
import { MODULES_ANALYTICS } from '../analytics/datastore/constants';
import {
	CORE_USER,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../googlesitekit/datastore/user/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'search-console', {
		storeName: MODULES_SEARCH_CONSOLE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		Icon: SearchConsoleIcon,
	} );
};

const isAnalyticsActive = ( select ) =>
	negateDefined( select( MODULES_ANALYTICS ).isGA4DashboardView() );
const isAnalytics4Active = ( select ) =>
	select( MODULES_ANALYTICS ).isGA4DashboardView();

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

	// Register widget reliant on Analytics (UA).
	widgets.registerWidget(
		'searchFunnel',
		{
			Component: SearchFunnelWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ 'search-console' ],
			isActive: isAnalyticsActive,
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	// Register widget reliant on Analytics 4 (GA4).
	widgets.registerWidget(
		'searchFunnelGA4',
		{
			Component: SearchFunnelWidgetGA4,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ 'search-console' ],
			isActive: isAnalytics4Active,
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	if ( isFeatureEnabled( 'userInput' ) ) {
		/*
		 * Key metrics widgets.
		 */
		widgets.registerWidget(
			KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
			{
				Component: PopularKeywordsWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'search-console' ],
				isActive: ( select ) =>
					select( CORE_USER ).isKeyMetricActive(
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS
					),
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);
	}
};
