/**
 * KeyMetrics widgets registration.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import AdsenseTopEarningContentWidget from './widget-tiles/AdsenseTopEarningContentWidget';
import AnalyticsLoyalVisitorsWidget from './widget-tiles/AnalyticsLoyalVisitorsWidget';
import AnalyticsNewVisitorsWidget from './widget-tiles/AnalyticsNewVisitorsWidget';
import AnalyticsTopTrafficSourceWidget from './widget-tiles/AnalyticsTopTrafficSourceWidget';
import AnalyticsEngagedTrafficSourceWidget from './widget-tiles/AnalyticsEngagedTrafficSourceWidget';
import AnalyticsPopularContentWidget from './widget-tiles/AnalyticsPopularContentWidget';
import AnalyticsPopularProductsWidget from './widget-tiles/AnalyticsPopularProductsWidget';
import AnalyticsTopCitiesWidget from './widget-tiles/AnalyticsTopCitiesWidget';
import AnalyticsTopCountriesWidget from './widget-tiles/AnalyticsTopCountriesWidget';
import AnalyticsConversionWidget from './widget-tiles/AnalyticsConversionWidget';
import SearchConsolePopularKeywordsWidget from './widget-tiles/SearchConsolePopularKeywordsWidget';
import TopConvertingTrafficSourceWidget from './widget-tiles/TopConvertingTrafficSourceWidget';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';

export const registerWidgets = ( widgets ) => {
	widgets.registerWidget(
		'kmAdsenseTopEarningContent',
		{
			Component: AdsenseTopEarningContentWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4', 'adsense' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		'kmAnalyticsLoyalVisitors',
		{
			Component: AnalyticsLoyalVisitorsWidget,
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
			Component: AnalyticsNewVisitorsWidget,
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
			Component: AnalyticsTopTrafficSourceWidget,
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
			Component: AnalyticsEngagedTrafficSourceWidget,
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
			Component: AnalyticsPopularContentWidget,
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
			Component: AnalyticsPopularProductsWidget,
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
			Component: AnalyticsTopCitiesWidget,
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
			Component: AnalyticsTopCountriesWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgets.registerWidget(
		'kmAnalyticsConversion',
		{
			Component: AnalyticsConversionWidget,
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

	widgets.registerWidget(
		'kmSearchConsolePopularKeywords',
		{
			Component: SearchConsolePopularKeywordsWidget,
			width: widgets.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);
};
