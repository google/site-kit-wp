/**
 * PageSpeed Insights module initialization.
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
	AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
	AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
} from '../../googlesitekit/widgets/default-areas';
import { SettingsView } from './components/settings';
import DashboardPageSpeedWidget from './components/dashboard/DashboardPageSpeedWidget';
import PageSpeedInsightsIcon from '../../../svg/graphics/pagespeed-insights.svg';
import { MODULES_PAGESPEED_INSIGHTS } from './datastore/constants';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'pagespeed-insights', {
		storeName: MODULES_PAGESPEED_INSIGHTS,
		SettingsViewComponent: SettingsView,
		Icon: PageSpeedInsightsIcon,
		features: [
			__(
				'Website performance reports for mobile and desktop will be disabled',
				'google-site-kit'
			),
		],
	} );
};

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'pagespeedInsightsWebVitals',
		{
			Component: DashboardPageSpeedWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			wrapWidget: false,
			modules: [ 'pagespeed-insights' ],
		},
		[
			AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
			AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		]
	);
};
