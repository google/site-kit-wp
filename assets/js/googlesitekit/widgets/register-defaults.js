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
import KeyMetricsSetupCTAWidget from '../../components/KeyMetrics/KeyMetricsSetupCTAWidget';

const { ...ADDITIONAL_WIDGET_CONTEXTS } = WIDGET_CONTEXTS;

const { ...ADDITIONAL_WIDGET_AREAS } = WIDGET_AREAS;

/**
 * Defines default widget areas for a given context
 * and registers non-module specific widgets.
 *
 * @since 1.12.0
 *
 * @param {Object} widgetsAPI Widgets API.
 */
export function registerDefaults( widgetsAPI ) {
	const {
		// Main dashboard
		CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
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
		AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
		AREA_MAIN_DASHBOARD_TRAFFIC_PRIMARY,
		AREA_MAIN_DASHBOARD_CONTENT_PRIMARY,
		AREA_MAIN_DASHBOARD_SPEED_PRIMARY,
		AREA_MAIN_DASHBOARD_MONETIZATION_PRIMARY,
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
		AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
		{
			title: __( 'Key metrics', 'google-site-kit' ),
			subtitle: __(
				'Track progress towards your goals with tailored metrics',
				'google-site-kit'
			),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_MAIN_DASHBOARD_KEY_METRICS
	);

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

	widgetsAPI.registerWidget(
		'keyMetricsSetupCTA',
		{
			Component: KeyMetricsSetupCTAWidget,
			width: [ widgetsAPI.WIDGET_WIDTHS.FULL ],
			priority: 1,
			wrapWidget: false,
			modules: [ 'search-console' ],
		},
		[ AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY ]
	);
}
