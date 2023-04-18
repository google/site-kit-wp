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
	AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
	AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
	AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
} from '../../googlesitekit/widgets/default-areas';
import AnalyticsIcon from '../../../svg/graphics/analytics.svg';
import { MODULES_ANALYTICS } from './datastore/constants';
import { SetupMain } from './components/setup';
import { SettingsEdit, SettingsView } from './components/settings';
import DashboardAllTrafficWidget from './components/dashboard/DashboardAllTrafficWidget';
import DashboardAllTrafficWidgetGA4 from './components/dashboard/DashboardAllTrafficWidgetGA4';
import DashboardOverallPageMetricsWidget from './components/dashboard/DashboardOverallPageMetricsWidget';
import DashboardOverallPageMetricsWidgetGA4 from './components/dashboard/DashboardOverallPageMetricsWidgetGA4';
import {
	ModulePopularPagesWidget,
	ModulePopularPagesWidgetGA4,
} from './components/module';
import { negateDefined } from '../../util/negate';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'analytics', {
		storeName: MODULES_ANALYTICS,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SetupComponent: SetupMain,
		Icon: AnalyticsIcon,
		features: [
			__( 'Audience overview', 'google-site-kit' ),
			__( 'Top pages', 'google-site-kit' ),
			__( 'Top acquisition channels', 'google-site-kit' ),
		],
	} );
};

const isAnalyticsActive = ( select ) =>
	negateDefined( select( MODULES_ANALYTICS ).isGA4DashboardView() );
const isAnalytics4Active = ( select ) =>
	select( MODULES_ANALYTICS ).isGA4DashboardView();

export const registerWidgets = ( widgets ) => {
	// Register Analytics (UA) Widgets.
	widgets.registerWidget(
		'analyticsAllTraffic',
		{
			Component: DashboardAllTrafficWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics' ],
			isActive: isAnalyticsActive,
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	widgets.registerWidget(
		'analyticsOverallPageMetrics',
		{
			Component: DashboardOverallPageMetricsWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 3,
			wrapWidget: false,
			modules: [ 'analytics' ],
			isActive: isAnalyticsActive,
		},
		[ AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY ]
	);

	widgets.registerWidget(
		'analyticsModulePopularPages',
		{
			Component: ModulePopularPagesWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 4,
			wrapWidget: false,
			modules: [ 'analytics' ],
			isActive: isAnalyticsActive,
		},
		[ AREA_MAIN_DASHBOARD_CONTENT_PRIMARY ]
	);

	// Register Analytics 4 (GA4) Widgets.
	widgets.registerWidget(
		'analyticsAllTrafficGA4',
		{
			Component: DashboardAllTrafficWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
			isActive: isAnalytics4Active,
		},
		[
			AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
			AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		]
	);

	widgets.registerWidget(
		'analyticsOverallPageMetricsGA4',
		{
			Component: DashboardOverallPageMetricsWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 3,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
			isActive: isAnalytics4Active,
		},
		[ AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY ]
	);

	widgets.registerWidget(
		'analyticsModulePopularPagesGA4',
		{
			Component: ModulePopularPagesWidgetGA4,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 4,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
			isActive: isAnalytics4Active,
		},
		[ AREA_MAIN_DASHBOARD_CONTENT_PRIMARY ]
	);
};
