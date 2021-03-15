/**
 * Analytics module initialization.
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
import {
	AREA_DASHBOARD_ALL_TRAFFIC,
	AREA_PAGE_DASHBOARD_ALL_TRAFFIC,
	AREA_DASHBOARD_SEARCH_FUNNEL,
	AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
	AREA_DASHBOARD_POPULARITY,
} from '../../googlesitekit/widgets/default-areas';
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import DashboardAllTrafficWidget from './components/dashboard/DashboardAllTrafficWidget';
import DashboardPopularPagesWidget from './components/dashboard/DashboardPopularPagesWidget';
import DashboardGoalsWidget from './components/dashboard/DashboardGoalsWidget';
import DashboardUniqueVisitorsWidget from './components/dashboard/DashboardUniqueVisitorsWidget';
import DashboardBounceRateWidget from './components/dashboard/DashboardBounceRateWidget';
import AnalyticsIcon from '../../../svg/analytics.svg';
import { STORE_NAME } from './datastore/constants';
import { CONTEXT_MODULE_ANALYTICS, AREA_MODULE_ANALYTICS_MAIN } from './constants';
import { WIDGET_AREA_STYLES } from '../../googlesitekit/widgets/datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule(
		'analytics',
		{
			storeName: STORE_NAME,
			SettingsEditComponent: SettingsEdit,
			SettingsViewComponent: SettingsView,
			SetupComponent: SetupMain,
			Icon: AnalyticsIcon,
			screenWidgetContext: CONTEXT_MODULE_ANALYTICS,
		}
	);
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'analyticsAllTraffic',
		{
			Component: DashboardAllTrafficWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_ALL_TRAFFIC,
			AREA_PAGE_DASHBOARD_ALL_TRAFFIC,
		],
	);

	widgets.registerWidget(
		'analyticsUniqueVisitors',
		{
			Component: DashboardUniqueVisitorsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 3,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);

	widgets.registerWidget(
		'analyticsGoals',
		{
			Component: DashboardGoalsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 4,
			wrapWidget: true,
		},
		[
			AREA_DASHBOARD_SEARCH_FUNNEL,
		],
	);

	widgets.registerWidget(
		'analyticsBounceRate',
		{
			Component: DashboardBounceRateWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 4,
			wrapWidget: true,
		},
		[
			AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		],
	);

	widgets.registerWidget(
		'analyticsPopularPages',
		{
			Component: DashboardPopularPagesWidget,
			width: widgets.WIDGET_WIDTHS.HALF,
			priority: 2,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_POPULARITY,
		],
	);

	widgets.registerWidgetArea(
		AREA_MODULE_ANALYTICS_MAIN,
		{
			priority: 1,
			style: WIDGET_AREA_STYLES.BOXES,
			title: __( 'Overview', 'google-site-kit' ),
		},
		CONTEXT_MODULE_ANALYTICS,
	);
};
