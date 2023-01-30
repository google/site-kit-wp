/**
 * Widgets API defaults
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
import * as WIDGET_CONTEXTS from './default-contexts';
import * as WIDGET_AREAS from './default-areas';
import { WIDGET_AREA_STYLES } from './datastore/constants';
import {
	AdsenseTopEarningContentWidget,
	AnalyticsLoyalVisitorsWidget,
	AnalyticsNewVisitorsWidget,
	AnalyticsTopTrafficSourceWidget,
	AnalyticsEngagedTrafficSourceWidget,
	AnalyticsPopularContentWidget,
	AnalyticsPopularProductsWidget,
	AnalyticsTopCitiesWidget,
	AnalyticsTopCountriesWidget,
	AnalyticsConversionWidget,
	SearchConsolePopularKeywordsWidget,
	TopConvertingTrafficSourceWidget,
} from '../../components/KeyMetrics/widget-tiles';

const { ...ADDITIONAL_WIDGET_CONTEXTS } = WIDGET_CONTEXTS;

const { ...ADDITIONAL_WIDGET_AREAS } = WIDGET_AREAS;

/**
 * Defines default widget areas for a given context.
 *
 * @since 1.12.0
 *
 * @param {Object} widgetsAPI Widgets API.
 */
export function registerDefaults( widgetsAPI ) {
	const {
		CONTEXT_MAIN_DASHBOARD_TRAFFIC,
		CONTEXT_MAIN_DASHBOARD_CONTENT,
		CONTEXT_MAIN_DASHBOARD_SPEED,
		CONTEXT_MAIN_DASHBOARD_MONETIZATION,
		// Entity dashboard
		CONTEXT_ENTITY_DASHBOARD_TRAFFIC,
		CONTEXT_ENTITY_DASHBOARD_CONTENT,
		CONTEXT_ENTITY_DASHBOARD_SPEED,
		CONTEXT_ENTITY_DASHBOARD_MONETIZATION,
	} = ADDITIONAL_WIDGET_CONTEXTS;

	const {
		// Main dashboard
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
		AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
		AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
		AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
		AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
		// Entity dashboard
		AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
		AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		AREA_ENTITY_DASHBOARD_MONETIZATION_PRIMARY,
	} = ADDITIONAL_WIDGET_AREAS;

	/*
	 * Main dashboard areas.
	 */

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
		{
			title: __(
				'Find out how your audience is growing',
				'google-site-kit'
			),
			subtitle: __(
				'Track your site’s traffic over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_TRAFFIC
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
		{
			title: __( 'See how your content is doing', 'google-site-kit' ),
			subtitle: __(
				'Keep track of your most popular pages and how people found them from Search',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_CONTENT
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
		{
			title: __(
				'Find out how visitors experience your site',
				'google-site-kit'
			),
			subtitle: __(
				'Keep track of how fast your pages are and get specific recommendations on what to improve',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_SPEED
	);

	widgetsAPI.registerWidgetArea(
		AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
		{
			title: __(
				'Find out how much you’re earning from your content',
				'google-site-kit'
			),
			subtitle: __(
				'Track your AdSense revenue over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_MONETIZATION
	);

	/*
	 * Entity dashboard areas.
	 */

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_TRAFFIC_PRIMARY,
		{
			title: __(
				'Find out how your audience is growing',
				'google-site-kit'
			),
			subtitle: __(
				'Track traffic to this page over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_TRAFFIC
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_CONTENT_PRIMARY,
		{
			title: __( 'See how your content is doing', 'google-site-kit' ),
			subtitle: __(
				'Understand how people found this page from Search',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_CONTENT
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_SPEED_PRIMARY,
		{
			title: __(
				'Find out how visitors experience this page',
				'google-site-kit'
			),
			subtitle: __(
				'Keep track of how fast your page is and get specific recommendations on what to improve',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_SPEED
	);

	widgetsAPI.registerWidgetArea(
		AREA_ENTITY_DASHBOARD_MONETIZATION_PRIMARY,
		{
			title: __(
				'Find out how much you’re earning from your content',
				'google-site-kit'
			),
			subtitle: __(
				'Track your AdSense revenue over time',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_ENTITY_DASHBOARD_MONETIZATION
	);

	/*
	 * Key metrics widgets.
	 */
	widgetsAPI.registerWidget(
		'kmAdsenseTopEarningContent',
		{
			Component: AdsenseTopEarningContentWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4', 'adsense' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsLoyalVisitors',
		{
			Component: AnalyticsLoyalVisitorsWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsNewVisitors',
		{
			Component: AnalyticsNewVisitorsWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsTopTrafficSource',
		{
			Component: AnalyticsTopTrafficSourceWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsEngagedTrafficSource',
		{
			Component: AnalyticsEngagedTrafficSourceWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsPopularContent',
		{
			Component: AnalyticsPopularContentWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsPopularProducts',
		{
			Component: AnalyticsPopularProductsWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsTopCities',
		{
			Component: AnalyticsTopCitiesWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsTopCountries',
		{
			Component: AnalyticsTopCountriesWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmAnalyticsConversion',
		{
			Component: AnalyticsConversionWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmTopConvertingTrafficSource',
		{
			Component: TopConvertingTrafficSourceWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'analytics-4' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);

	widgetsAPI.registerWidget(
		'kmSearchConsolePopularKeywords',
		{
			Component: SearchConsolePopularKeywordsWidget,
			width: widgetsAPI.WIDGET_WIDTHS.QUARTER,
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);
}
