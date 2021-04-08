/**
 * Analytics module initialization.
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
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getModulesData } from '../../util';
import { createAddToFilter } from '../../util/helpers';
import LegacyAnalyticsDashboardWidget from './components/dashboard/LegacyAnalyticsDashboardWidget';
import LegacyAnalyticsDashboardWidgetTopLevel from './components/dashboard/LegacyAnalyticsDashboardWidgetTopLevel';
import AnalyticsDashboardDetailsWidgetTopAcquisitionSources from './components/dashboard-details/AnalyticsDashboardDetailsWidgetTopAcquisitionSources';
import LegacyAnalyticsAdSenseDashboardWidgetTopPagesTable from './components/dashboard/LegacyAnalyticsAdSenseDashboardWidgetTopPagesTable';
import LegacyAnalyticsDashboardWidgetPopularPagesTable from './components/dashboard/LegacyAnalyticsDashboardWidgetPopularPagesTable';
import LegacyAdSenseDashboardWidgetTopPagesTableSmall from './components/dashboard/LegacyAdSenseDashboardWidgetTopPagesTableSmall';
import LegacyDashboardAllTraffic from './components/dashboard/DashboardAllTrafficWidget/LegacyDashboardAllTraffic';

const slug = 'analytics';

const modulesData = getModulesData();

if ( modulesData.analytics.active ) {
	const addAnalyticsDashboardWidget = createAddToFilter( <LegacyAnalyticsDashboardWidget /> );
	const legacyDashboardAllTraffic = createAddToFilter( <LegacyDashboardAllTraffic /> );
	const addLegacyAnalyticsDashboardWidgetTopLevel = createAddToFilter( <LegacyAnalyticsDashboardWidgetTopLevel /> );
	const addAnalyticsDashboardDetailsWidget = createAddToFilter( <AnalyticsDashboardDetailsWidgetTopAcquisitionSources /> );
	const addAnalyticsAdSenseTopPagesWidget = createAddToFilter( <LegacyAnalyticsAdSenseDashboardWidgetTopPagesTable /> );
	const addLegacyAnalyticsDashboardWidgetPopularPagesTable = createAddToFilter( <LegacyAnalyticsDashboardWidgetPopularPagesTable /> );
	const addLegacyAdSenseDashboardWidgetTopPagesTableSmall = createAddToFilter( <LegacyAdSenseDashboardWidgetTopPagesTableSmall /> );

	/**
	 * Add components to the Site Kit Dashboard.
	 */
	addFilter( 'googlesitekit.DashboardModule',
		'googlesitekit.Analytics',
		legacyDashboardAllTraffic, 9 );
	addFilter( 'googlesitekit.DashboardSearchFunnel',
		'googlesitekit.Analytics',
		addLegacyAnalyticsDashboardWidgetTopLevel, 11 );
	addFilter( 'googlesitekit.DashboardPopularity',
		'googlesitekit.Analytics',
		addLegacyAnalyticsDashboardWidgetPopularPagesTable, 20 );
	addFilter( 'googlesitekit.AnalyticsAdSenseTopPagesTableSmall',
		'googlesitekit.Analytics',
		addLegacyAdSenseDashboardWidgetTopPagesTableSmall, 20 );

	/**
	 * Add components to the Site Kit URL Details Dashboard.
	 */
	addFilter( 'googlesitekit.DashboardDetailsModule',
		'googlesitekit.Analytics',
		addAnalyticsDashboardDetailsWidget, 20 );

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
