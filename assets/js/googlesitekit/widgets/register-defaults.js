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
import URLSearchWidget from '../../googlesitekit/widgets/components/URLSearchWidget';
import {
	CONTEXT_DASHBOARD,
	CONTEXT_PAGE_DASHBOARD,
} from './default-contexts';
import {
	AREA_DASHBOARD_ALL_TRAFFIC,
	AREA_DASHBOARD_SEARCH_FUNNEL,
	AREA_DASHBOARD_ACQUISITION,
	AREA_DASHBOARD_SPEED,
	AREA_DASHBOARD_EARNINGS,
	AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
	AREA_PAGE_DASHBOARD_ALL_TRAFFIC,
	AREA_PAGE_DASHBOARD_ACQUISITION,
	AREA_PAGE_DASHBOARD_SPEED,
} from './default-areas';
import { WIDGET_URL_SEARCH } from './default-widgets';
import { WIDGET_AREA_STYLES, WIDGET_WIDTHS } from './datastore/constants';

/**
 * Defines default widget areas for a given context.
 *
 * @since 1.12.0
 *
 * @param {Object} widgetsAPI Widgets API.
 */
export function registerDefaults( widgetsAPI ) {
	widgetsAPI.registerWidgetArea(
		AREA_DASHBOARD_ALL_TRAFFIC,
		{
			title: __( 'Your Traffic at a Glance', 'google-site-kit' ),
			subtitle: __( 'How people found your site', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 1,
		},
		CONTEXT_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_DASHBOARD_SEARCH_FUNNEL,
		{
			title: __( 'Search Funnel', 'google-site-kit' ),
			subtitle: __( 'How your site appeared in Search results and how many visitors you got from Search', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.COMPOSITE,
			priority: 2,
		},
		CONTEXT_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_DASHBOARD_ACQUISITION,
		{
			title: __( 'Acquisition', 'google-site-kit' ),
			subtitle: __( 'Your most popular pages and how people found them from Search', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 3,
		},
		CONTEXT_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_DASHBOARD_SPEED,
		{
			title: __( 'Page Speed and Experience', 'google-site-kit' ),
			subtitle: __( 'How fast your home page loads, how quickly people can interact with your content, and how stable your content is', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 4,
		},
		CONTEXT_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_DASHBOARD_EARNINGS,
		{
			title: __( 'Earnings', 'google-site-kit' ),
			subtitle: __( 'How much you’re earning from your content through AdSense', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 5,
		},
		CONTEXT_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_PAGE_DASHBOARD_SEARCH_FUNNEL,
		{
			title: __( 'Search Funnel', 'google-site-kit' ),
			subtitle: __( 'How your site appeared in Search results and how many visitors you got from Search', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.COMPOSITE,
			priority: 1,
		},
		CONTEXT_PAGE_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_PAGE_DASHBOARD_ALL_TRAFFIC,
		{
			title: __( 'Your Traffic at a Glance', 'google-site-kit' ),
			subtitle: __( 'How people found your page', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 2,
		},
		CONTEXT_PAGE_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_PAGE_DASHBOARD_ACQUISITION,
		{
			title: __( 'Acquisition', 'google-site-kit' ),
			subtitle: __( 'What people searched for to find your page', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 3,
		},
		CONTEXT_PAGE_DASHBOARD,
	);

	widgetsAPI.registerWidgetArea(
		AREA_PAGE_DASHBOARD_SPEED,
		{
			title: __( 'Page Speed and Experience', 'google-site-kit' ),
			subtitle: __( 'How fast your page loads, how quickly people can interact with your content, and how stable your content is', 'google-site-kit' ),
			style: WIDGET_AREA_STYLES.BOXES,
			priority: 4,
		},
		CONTEXT_PAGE_DASHBOARD,
	);

	widgetsAPI.registerWidget(
		WIDGET_URL_SEARCH,
		{
			priority: 100,
			width: [ WIDGET_WIDTHS.HALF, WIDGET_WIDTHS.FULL ],
			Component: URLSearchWidget,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_ACQUISITION,
		],
	);
}
