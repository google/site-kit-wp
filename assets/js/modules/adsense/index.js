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
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { AREA_DASHBOARD_EARNINGS } from '../../googlesitekit/widgets/default-areas';
import { fillFilterWithComponent } from '../../util';
import { SetupMain } from './components/setup';
import {
	SettingsEdit,
	SettingsSetupIncomplete,
	SettingsView,
} from './components/settings';
import {
	DashboardZeroData,
	DashboardSummaryWidget,
	DashboardTopEarningPagesWidget,
} from './components/dashboard';
import ModuleTopEarningPagesWidget from './components/module/ModuleTopEarningPagesWidget';
import { ModuleOverviewWidget } from './components/module';
import AdSenseIcon from '../../../svg/adsense.svg';
import { STORE_NAME } from './datastore/constants';
import { ERROR_CODE_ADBLOCKER_ACTIVE, CONTEXT_MODULE_ADSENSE, AREA_MODULE_ADSENSE_MAIN } from './constants';
import { WIDGET_AREA_STYLES } from '../../googlesitekit/widgets/datastore/constants';
import { registerStore as registerDatastore } from './datastore';

addFilter(
	'googlesitekit.AdSenseDashboardZeroData',
	'googlesitekit.AdSenseDashboardZeroDataRefactored',
	fillFilterWithComponent( DashboardZeroData )
);

export const registerStore = ( registry ) => {
	registerDatastore( registry );
};

export const registerModule = ( modules ) => {
	modules.registerModule(
		'adsense',
		{
			storeName: STORE_NAME,
			SettingsEditComponent: SettingsEdit,
			SettingsViewComponent: SettingsView,
			SettingsSetupIncompleteComponent: SettingsSetupIncomplete,
			SetupComponent: SetupMain,
			Icon: AdSenseIcon,
			features: [
				__( 'Monetize your website', 'google-site-kit' ),
				__( 'Intelligent, automatic ad placement', 'google-site-kit' ),
			],
			checkRequirements: async ( registry ) => {
				if ( ! registry.select( STORE_NAME ).isAdBlockerActive() ) {
					return;
				}

				throw {
					code: ERROR_CODE_ADBLOCKER_ACTIVE,
					message: __( 'Ad blocker detected, you need to disable it in order to set up AdSense.', 'google-site-kit' ),
					data: null,
				};
			},
			screenWidgetContext: CONTEXT_MODULE_ADSENSE,
		}
	);
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'adsenseSummary',
		{
			Component: DashboardSummaryWidget,
			width: widgets.WIDGET_WIDTHS.HALF,
			priority: 1,
			wrapWidget: false,

		},
		[
			AREA_DASHBOARD_EARNINGS,
		],
	);
	widgets.registerWidget(
		'adsenseTopEarningPages',
		{
			Component: DashboardTopEarningPagesWidget,
			width: widgets.WIDGET_WIDTHS.HALF,
			priority: 2,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_EARNINGS,
		],
	);
	widgets.registerWidget(
		'adsenseModuleOverview',
		{
			Component: ModuleOverviewWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
		},
		[
			AREA_MODULE_ADSENSE_MAIN,
		],
	);
	widgets.registerWidgetArea(
		AREA_MODULE_ADSENSE_MAIN,
		{
			priority: 1,
			style: WIDGET_AREA_STYLES.BOXES,
			title: __( 'Overview', 'google-site-kit' ),
		},
		CONTEXT_MODULE_ADSENSE,
	);

	widgets.registerWidget(
		'adsenseModuleTopEarningPages',
		{
			Component: ModuleTopEarningPagesWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 2,
			wrapWidget: false,
		},
		[ AREA_MODULE_ADSENSE_MAIN ],
	);
};
