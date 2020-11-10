/**
 * AdSense module initialization.
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
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Modules from 'googlesitekit-modules';
import Widgets from 'googlesitekit-widgets';
import Data from 'googlesitekit-data';
const { select } = Data;
import './datastore';
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
import { STORE_NAME } from './datastore/constants';

addFilter(
	'googlesitekit.ModuleSetupIncomplete',
	'googlesitekit.AdSenseModuleSettingsSetupIncomplete',
	fillFilterWithComponent( ( props ) => {
		const { slug, OriginalComponent } = props;
		if ( 'adsense' !== slug ) {
			return <OriginalComponent { ...props } />;
		}
		return (
			<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
				<SettingsSetupIncomplete />
			</div>
		);
	} )
);

addFilter(
	'googlesitekit.AdSenseDashboardZeroData',
	'googlesitekit.AdSenseDashboardZeroDataRefactored',
	fillFilterWithComponent( DashboardZeroData )
);

domReady( () => {
	Modules.registerModule(
		'adsense',
		{
			settingsEditComponent: SettingsEdit,
			settingsViewComponent: SettingsView,
			setupComponent: SetupMain,
			checkRequirements: () => {
				const isAdBlockerActive = select( STORE_NAME ).isAdBlockerActive();
				if ( ! isAdBlockerActive ) {
					return;
				}

				throw __( 'Ad blocker detected, you need to disable it in order to set up AdSense.', 'google-site-kit' );
			},
		}
	);

	Widgets.registerWidget(
		'adsenseSummary',
		{
			component: DashboardSummaryWidget,
			width: Widgets.WIDGET_WIDTHS.HALF,
			priority: 1,
			wrapWidget: false,

		},
		[
			AREA_DASHBOARD_EARNINGS,
		],
	);
	Widgets.registerWidget(
		'adsenseTopEarningPages',
		{
			component: DashboardTopEarningPagesWidget,
			width: Widgets.WIDGET_WIDTHS.HALF,
			priority: 2,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_EARNINGS,
		],
	);
} );
