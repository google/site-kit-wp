/**
 * PageSpeed Insights module widget registrations.
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
	AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
	AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
} from '@/js/googlesitekit/widgets/default-areas';
import DashboardPageSpeedWidget from '@/js/modules/pagespeed-insights/components/dashboard/DashboardPageSpeedWidget';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';

export function registerWidgets( widgets ) {
	widgets.registerWidget(
		'pagespeedInsightsWebVitals',
		{
			Component: DashboardPageSpeedWidget,
			width: widgets.WIDGET_WIDTHS.FULL,
			wrapWidget: false,
			modules: [ MODULE_SLUG_PAGESPEED_INSIGHTS ],
		},
		[
			AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
			AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		]
	);
}
