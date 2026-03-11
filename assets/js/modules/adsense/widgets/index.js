/**
 * AdSense module widget registrations.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import {
	AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
	AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';
import {
	AdBlockingRecoverySetupCTAWidget,
	AdBlockerWarningWidget,
	AdSenseConnectCTAWidget,
	DashboardTopEarningPagesWidgetGA4,
} from '@/js/modules/adsense/components/dashboard';
import { ModuleOverviewWidget } from '@/js/modules/adsense/components/module';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { TopEarningContentWidget } from '@/js/modules/adsense/components/widgets';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';

export function registerWidgets( widgets ) {
	widgets.registerWidget(
		'adBlockingRecovery',
		{
			Component: AdBlockingRecoverySetupCTAWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	/*
	 * Key metrics widgets.
	 */
	widgets.registerWidget(
		KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
		{
			Component: TopEarningContentWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
			isActive: ( select ) => {
				const isViewOnly = ! select( CORE_USER ).isAuthenticated();

				if (
					! select( CORE_USER ).isKeyMetricActive(
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT
					)
				) {
					return false;
				}

				const isAdSenseLinked =
					select( MODULES_ANALYTICS_4 ).getAdSenseLinked();

				if ( isViewOnly && ! isAdSenseLinked ) {
					return false;
				}

				return true;
			},
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		'adBlockerWarning',
		{
			Component: AdBlockerWarningWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 1,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);

	widgets.registerWidget(
		'adsenseModuleOverview',
		{
			Component: ModuleOverviewWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			priority: 2,
			wrapWidget: false,
			modules: [ MODULE_SLUG_ADSENSE ],
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
			modules: [ MODULE_SLUG_ADSENSE ],
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
			modules: [ MODULE_SLUG_ADSENSE, MODULE_SLUG_ANALYTICS_4 ],
		},
		[ AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY ]
	);
}
