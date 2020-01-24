/**
 * Analytics module initialization.
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
import { fillFilterWithComponent, getSiteKitAdminURL } from 'GoogleUtil';
import { createAddToFilter } from 'GoogleUtil/helpers';
/**
 * Internal dependencies
 */
import AnalyticsDashboardWidget from './dashboard/dashboard-widget';
import AnalyticsAdminbarWidget from './adminbar/adminbar-widget';
import AnalyticsAllTraffic from './dashboard/dashboard-widget-all-traffic';
import AnalyticsDashboardWidgetTopLevel from './dashboard/dashboard-widget-top-level';
import WPAnalyticsDashboardWidgetOverview from './wp-dashboard/wp-dashboard-widget-overview';
import AnalyticsDashboardDetailsWidgetTopAcquisitionSources from './dashboard-details/dashboard-details-widget-top-acquisition-sources';
import WPAnalyticsDashboardWidgetTopPagesTable from './wp-dashboard/wp-dashboard-widget-top-pages-table';
import AnalyticsAdSenseDashboardWidgetTopPagesTable from './dashboard/dashboard-widget-analytics-adsense-top-pages';
import AnalyticsDashboardWidgetPopularPagesTable from './dashboard/dashboard-widget-popular-pages-table';
import AdSenseDashboardWidgetTopPagesTableSmall from './dashboard/dashboard-widget-top-earning-pages-small';
import AnalyticsSetup from './setup';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
const slug = 'analytics';

const addAnalyticsAdminbarWidget = createAddToFilter( <AnalyticsAdminbarWidget /> );

/**
 * Add components to the adminbar.
 */
addFilter( 'googlesitekit.AdminbarModules',
	'googlesitekit.Analytics',
	addAnalyticsAdminbarWidget, 11 );

// If setup is not complete, show the signup flow.
if ( ! googlesitekit.modules[ slug ].setupComplete ) {
	const {
		reAuth,
		currentScreen,
	} = googlesitekit.admin;
	const id = currentScreen ? currentScreen.id : null;
	if ( ! reAuth && 'site-kit_page_googlesitekit-module-analytics' === id ) {
		// Setup incomplete: redirect to the setup flow.
		global.location = getSiteKitAdminURL(
			`googlesitekit-module-${ slug }`,
			{
				reAuth: true,
				slug,
			}
		);
	}
}

if ( googlesitekit.modules.analytics.active ) {
	const addAnalyticsDashboardWidget = createAddToFilter( <AnalyticsDashboardWidget /> );
	const addAnalyticsAllTraffic = createAddToFilter( <AnalyticsAllTraffic /> );
	const addWPAnalyticsDashboardWidgetOverview = createAddToFilter( <WPAnalyticsDashboardWidgetOverview /> );
	const addWPAnalyticsDashboardWidgetTopPagesTable = createAddToFilter( <WPAnalyticsDashboardWidgetTopPagesTable /> );
	const addAnalyticsDashboardWidgetTopLevel = createAddToFilter( <AnalyticsDashboardWidgetTopLevel /> );
	const addAnalyticsDashboardDetailsWidget = createAddToFilter( <AnalyticsDashboardDetailsWidgetTopAcquisitionSources /> );
	const addAnalyticsAdSenseTopPagesWidget = createAddToFilter( <AnalyticsAdSenseDashboardWidgetTopPagesTable /> );
	const addAnalyticsDashboardWidgetPopularPagesTable = createAddToFilter( <AnalyticsDashboardWidgetPopularPagesTable /> );
	const addAnalyticsDashboardWidgetPopularPagesTableSmall = createAddToFilter( <AdSenseDashboardWidgetTopPagesTableSmall /> );

	/**
	 * Add components to the Site Kit Dashboard.
	 */
	addFilter( 'googlesitekit.DashboardModule',
		'googlesitekit.Analytics',
		addAnalyticsAllTraffic, 9 );
	addFilter( 'googlesitekit.DashboardSearchFunnel',
		'googlesitekit.Analytics',
		addAnalyticsDashboardWidgetTopLevel, 11 );
	addFilter( 'googlesitekit.DashboardPopularity',
		'googlesitekit.Analytics',
		addAnalyticsDashboardWidgetPopularPagesTable, 20 );
	addFilter( 'googlesitekit.AnalyticsAdSenseTopPagesTableSmall',
		'googlesitekit.Analytics',
		addAnalyticsDashboardWidgetPopularPagesTableSmall, 20 );

	/**
	* Add components to the Site Kit URL Details Dashboard.
	*/
	addFilter( 'googlesitekit.DashboardDetailsModule',
		'googlesitekit.Analytics',
		addAnalyticsDashboardDetailsWidget, 20 );

	/**
	 * Add components to the WordPress Dashboard widget.
	 */
	addFilter( 'googlesitekit.WPDashboardHeader',
		'googlesitekit.Analytics',
		addWPAnalyticsDashboardWidgetOverview );
	addFilter( 'googlesitekit.WPDashboardModule',
		'googlesitekit.Analytics',
		addWPAnalyticsDashboardWidgetTopPagesTable );

	/**
	 * Add components to the module detail page.
	 */
	addFilter( 'googlesitekit.ModuleApp-' + slug,
		'googlesitekit.Analytics',
		addAnalyticsDashboardWidget );

	/**
	 * Add components to the AdSense Dashboard.
	 */
	addFilter( 'googlesitekit.AnalyticsAdSenseTopPagesTable',
		'googlesitekit.Analytics',
		addAnalyticsAdSenseTopPagesWidget, 11 );

	/**
	 * Add components to the settings page.
	 */
	addFilter( `googlesitekit.ModuleSettingsDetails-${ slug }`,
		'googlesitekit.AnalyticsModuleSettingsDetails',
		fillFilterWithComponent( AnalyticsSetup, {
			onSettingsPage: true,
		} ) );

	addFilter( `googlesitekit.showDateRangeSelector-${ slug }`,
		'googlesitekit.analyticsShowDateRangeSelector',
		() => true );

	/**
	 * Add component to the setup wizard
	 */
	addFilter( `googlesitekit.ModuleSetup-${ slug }`,
		'googlesitekit.AnalyticsModuleSetupWizard',
		fillFilterWithComponent( AnalyticsSetup, {
			onSettingsPage: false,
		} ) );
}
