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
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getSiteKitAdminURL, getModulesData } from '../../util';
import { createAddToFilter } from '../../util/helpers';
import AnalyticsDashboardWidget from './components/dashboard/AnalyticsDashboardWidget';
import AnalyticsAdminbarWidget from './components/adminbar/AnalyticsAdminbarWidget';
import LegacyAnalyticsAllTraffic from './components/dashboard/LegacyAnalyticsAllTraffic';
import AnalyticsDashboardWidgetTopLevel from './components/dashboard/AnalyticsDashboardWidgetTopLevel';
import WPAnalyticsDashboardWidgetOverview from './components/wp-dashboard/WPAnalyticsDashboardWidgetOverview';
import AnalyticsDashboardDetailsWidgetTopAcquisitionSources from './components/dashboard-details/AnalyticsDashboardDetailsWidgetTopAcquisitionSources';
import WPAnalyticsDashboardWidgetTopPagesTable from './components/wp-dashboard/WPAnalyticsDashboardWidgetTopPagesTable';
import AnalyticsAdSenseDashboardWidgetTopPagesTable from './components/dashboard/AnalyticsAdSenseDashboardWidgetTopPagesTable';
import AnalyticsDashboardWidgetPopularPagesTable from './components/dashboard/AnalyticsDashboardWidgetPopularPagesTable';
import AdSenseDashboardWidgetTopPagesTableSmall from './components/dashboard/AdSenseDashboardWidgetTopPagesTableSmall';

const slug = 'analytics';

const addAnalyticsAdminbarWidget = createAddToFilter( <AnalyticsAdminbarWidget /> );

/**
 * Add components to the adminbar.
 */
addFilter( 'googlesitekit.AdminbarModules',
	'googlesitekit.Analytics',
	addAnalyticsAdminbarWidget, 11 );

const modulesData = getModulesData();

// If setup is not complete, show the signup flow.
if ( ! modulesData[ slug ].setupComplete ) {
	const {
		reAuth,
		currentScreen,
	} = global._googlesitekitLegacyData.admin;
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

if ( modulesData.analytics.active ) {
	const addAnalyticsDashboardWidget = createAddToFilter( <AnalyticsDashboardWidget /> );
	const addAnalyticsAllTraffic = createAddToFilter( <LegacyAnalyticsAllTraffic /> );
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

	if ( modulesData[ slug ].setupComplete ) {
		/**
		 * Add components to the module detail page.
		 */
		addFilter( 'googlesitekit.ModuleApp-' + slug,
			'googlesitekit.Analytics',
			addAnalyticsDashboardWidget );
	}

	/**
	 * Add components to the AdSense Dashboard.
	 */
	addFilter( 'googlesitekit.AnalyticsAdSenseTopPagesTable',
		'googlesitekit.Analytics',
		addAnalyticsAdSenseTopPagesWidget, 11 );

	addFilter( `googlesitekit.showDateRangeSelector-${ slug }`,
		'googlesitekit.analyticsShowDateRangeSelector',
		() => true );
}
