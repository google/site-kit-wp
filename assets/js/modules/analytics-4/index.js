/**
 * Analytics-4 module initialization.
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
import {
	EngagedTrafficSourceWidget,
	LoyalVisitorsWidget,
	NewVisitorsWidget,
	PopularContentWidget,
	PopularProductsWidget,
	TopCitiesWidget,
	TopCountriesWidget,
	TopTrafficSourceWidget,
	TopConvertingTrafficSourceWidget,
} from './components/widgets';
import AnalyticsIcon from '../../../svg/graphics/analytics.svg';
import { MODULES_ANALYTICS_4 } from './datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { isFeatureEnabled } from '../../features';

export { registerStore } from './datastore';

export const registerModule = ( modules ) => {
	modules.registerModule( 'analytics-4', {
		storeName: MODULES_ANALYTICS_4,
		Icon: AnalyticsIcon,
	} );
};

export const registerWidgets = ( widgets ) => {
	if ( isFeatureEnabled( 'userInput' ) ) {
		/*
		 * Key metrics widgets.
		 */
		widgets.registerWidget(
			'kmAnalyticsLoyalVisitors',
			{
				Component: LoyalVisitorsWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsNewVisitors',
			{
				Component: NewVisitorsWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsTopTrafficSource',
			{
				Component: TopTrafficSourceWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsEngagedTrafficSource',
			{
				Component: EngagedTrafficSourceWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsPopularContent',
			{
				Component: PopularContentWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsPopularProducts',
			{
				Component: PopularProductsWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsTopCities',
			{
				Component: TopCitiesWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmAnalyticsTopCountries',
			{
				Component: TopCountriesWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);

		widgets.registerWidget(
			'kmTopConvertingTrafficSource',
			{
				Component: TopConvertingTrafficSourceWidget,
				width: widgets.WIDGET_WIDTHS.QUARTER,
				priority: 1,
				wrapWidget: false,
				modules: [ 'analytics-4' ],
			},
			[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
		);
	}
};
