/**
 * AdSense module initialization.
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
import { AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { SetupMain } from './components/setup';
import { SetupMain as SetupMainV2 } from './components/setup/v2';
import {
	SettingsEdit,
	SettingsSetupIncomplete,
	SettingsView,
} from './components/settings';
import {
	DashboardTopEarningPagesWidget,
	AdBlockerWarningWidget,
	AdSenseConnectCTAWidget,
	DashboardTopEarningPagesWidgetGA4,
} from './components/dashboard';
import { ModuleOverviewWidget } from './components/module';
import AdSenseIcon from '../../../svg/graphics/adsense.svg';
import { MODULES_ADSENSE } from './datastore/constants';
import {
	AREA_MODULE_ADSENSE_MAIN,
	ERROR_CODE_ADBLOCKER_ACTIVE,
} from './constants';
import { isGA4DashboardView } from '../analytics/datastore/settings';
import { isFeatureEnabled } from '../../features';
export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'adsense', {
		storeName: MODULES_ADSENSE,
		SettingsEditComponent: SettingsEdit,
		SettingsViewComponent: SettingsView,
		SettingsSetupIncompleteComponent: SettingsSetupIncomplete,
		SetupComponent: isFeatureEnabled( 'adsenseSetupV2' )
			? SetupMainV2
			: SetupMain,
		Icon: AdSenseIcon,
		features: [
			__( 'Intelligent, automatic ad placement', 'google-site-kit' ),
			__( 'Revenue from ads placed on your site', 'google-site-kit' ),
			__( 'AdSense insights through Site Kit', 'google-site-kit' ),
		],
		checkRequirements: async ( registry ) => {
			const adBlockerActive = await registry
				.__experimentalResolveSelect( MODULES_ADSENSE )
				.isAdBlockerActive();

			if ( ! adBlockerActive ) {
				return;
			}

			const message = registry
				.select( MODULES_ADSENSE )
				.getAdBlockerWarningMessage();

			throw {
				code: ERROR_CODE_ADBLOCKER_ACTIVE,
				message,
				data: null,
			};
		},
	} );
};

const isAnalyticsActive = ( select ) => ! isGA4DashboardView( select );
const isAnalytics4Active = ( select ) => isGA4DashboardView( select );

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'adBlockerWarning',
		{
			Component: AdBlockerWarningWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ 'adsense' ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY, AREA_MODULE_ADSENSE_MAIN ]
	);

	widgets.registerWidget(
		'adsenseModuleOverview',
		{
			Component: ModuleOverviewWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 2,
			wrapWidget: false,
			modules: [ 'adsense' ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	widgets.registerWidget(
		'adsenseConnectCTA',
		{
			Component: AdSenseConnectCTAWidget,
			width: [ widgets.WIDGET_WIDTHS.FULL ],
			priority: 2,
			wrapWidget: false,
			modules: [ 'adsense' ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	// Register widget reliant on Analytics (UA).
	widgets.registerWidget(
		'adsenseTopEarningPages',
		{
			Component: DashboardTopEarningPagesWidget,
			width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ 'adsense', 'analytics' ],
			isActive: isAnalyticsActive,
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	// Register widget reliant on Analytics 4 (GA4).
	widgets.registerWidget(
		'adsenseTopEarningPagesGA4',
		{
			Component: DashboardTopEarningPagesWidgetGA4,
			width: [ widgets.WIDGET_WIDTHS.HALF, widgets.WIDGET_WIDTHS.FULL ],
			priority: 3,
			wrapWidget: false,
			modules: [ 'adsense', 'analytics-4' ],
			isActive: isAnalytics4Active,
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);
};
