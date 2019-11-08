/**
 * PageSpeed Insights module initialization.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * External dependencies
 */
import { createAddToFilter } from 'GoogleUtil/helpers';

/**
 * Internal dependencies
 */
import DashboardSpeed from './dashboard/dashboard-widget-speed';
import PageSpeedInsightsDashboardWidgetHomepageSpeed from './dashboard/dashboard-widget-homepage-speed';
import PageSpeedInsightsCTA from './dashboard/dashboard-cta';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
const {
	active,
	setupComplete,
} = googlesitekit.modules[ 'pagespeed-insights' ];

if ( active && setupComplete ) {
	const addDashboardSpeed = createAddToFilter( <DashboardSpeed /> );
	const addPageSpeedInsightsDashboardWidgetHomepageSpeed = createAddToFilter( <PageSpeedInsightsDashboardWidgetHomepageSpeed /> );

	/**
	* Add components to the Site Kit Dashboard.
	*/
	addFilter( 'googlesitekit.DashboardModule',
		'googlesitekit.PageSpeedInsights',
		addDashboardSpeed, 45 );
	addFilter( 'googlesitekit.DashboardSpeed',
		'googlesitekit.PageSpeedInsightsHomepageSpeed',
		addPageSpeedInsightsDashboardWidgetHomepageSpeed );
} else {
	const addPageSpeedInsightsCTA = createAddToFilter( <PageSpeedInsightsCTA /> );
	addFilter( 'googlesitekit.DashboardModule',
		'googlesitekit.PageSpeedInsights',
		addPageSpeedInsightsCTA, 45 );
}
