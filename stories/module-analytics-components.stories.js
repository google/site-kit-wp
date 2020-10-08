/**
 * Analytics Module Component Stories.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { generateReportBasedWidgetStories } from './utils/generate-widget-stories';
import DashboardAllTrafficWidget from '../assets/js/modules/analytics/components/dashboard/DashboardAllTrafficWidget';
import DashboardPopularPagesWidget from '../assets/js/modules/analytics/components/dashboard/DashboardPopularPagesWidget';
import DashboardBounceRateWidget from '../assets/js/modules/analytics/components/dashboard/DashboardBounceRateWidget';
import DashboardGoalsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardGoalsWidget';
import DashboardUniqueVisitorsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardUniqueVisitorsWidget';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore';
import {
	accountsPropertiesProfiles,
	goals,
	dashboardAllTrafficArgs,
	dashboardAllTrafficData,
	pageDashboardAllTrafficArgs,
	pageDashboardAllTrafficData,
	dashboardPopularPagesArgs,
	dashboardPopularPagesData,
	pageDashboardBounceRateWidgetArgs,
	pageDashboardBounceRateWidgetData,
	pageDashboardUniqueVisitorsSparkArgs,
	pageDashboardUniqueVisitorsSparkData,
	pageDashboardUniqueVisitorsVisitorArgs,
	pageDashboardUniqueVisitorsVisitorData,
	dashboardBounceRateWidgetArgs,
	dashboardBounceRateWidgetData,
	dashboardGoalsWidgetArgs,
	dashboardGoalsWidgetData,
	dashboardUniqueVisitorsSparkArgs,
	dashboardUniqueVisitorsVisitorArgs,
	dashboardUniqueVisitorsSparkData,
	dashboardUniqueVisitorsVisitorData,
} from '../assets/js/modules/analytics/datastore/__fixtures__';

/**
 * Additional setup function.
 *
 * @since n.e.x.t
 *
 * @param {wp.data.registry} registry Registry with all available stores registered.
 */
const setup = ( registry ) => {
	const [ property ] = accountsPropertiesProfiles.properties;
	// eslint-disable-next-line sitekit/camelcase-acronyms
	registry.dispatch( STORE_NAME ).setAccountID( property.accountId );
	// eslint-disable-next-line sitekit/camelcase-acronyms
	registry.dispatch( STORE_NAME ).setInternalWebPropertyID( property.internalWebPropertyId );
	// eslint-disable-next-line sitekit/camelcase-acronyms
	registry.dispatch( STORE_NAME ).setProfileID( property.defaultProfileId );
};

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	data: dashboardAllTrafficData,
	options: dashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	data: pageDashboardAllTrafficData,
	options: pageDashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
	wrapWidget: false,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Bounce Rate Widget',
	data: dashboardBounceRateWidgetData,
	options: dashboardBounceRateWidgetArgs,
	component: DashboardBounceRateWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Bounce Rate Widget',
	data: pageDashboardBounceRateWidgetData,
	options: pageDashboardBounceRateWidgetArgs,
	component: DashboardBounceRateWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Goals Widget',
	data: dashboardGoalsWidgetData,
	options: dashboardGoalsWidgetArgs,
	component: DashboardGoalsWidget,
	additionalVariants: {
		'No Goals': { data: dashboardGoalsWidgetData, options: dashboardGoalsWidgetArgs },
	},
	additionalVariantCallbacks: {
		Loaded: ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
		'Data Unavailable': ( dispatch ) => dispatch( STORE_NAME ).receiveGetGoals( goals ),
	},
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Unique Visitors Widget',
	data: [
		dashboardUniqueVisitorsVisitorData,
		dashboardUniqueVisitorsSparkData,
	],
	options: [
		dashboardUniqueVisitorsVisitorArgs,
		dashboardUniqueVisitorsSparkArgs,
	],
	component: DashboardUniqueVisitorsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Unique Visitors Widget',
	data: [
		pageDashboardUniqueVisitorsVisitorData,
		pageDashboardUniqueVisitorsSparkData,
	],
	options: [
		pageDashboardUniqueVisitorsVisitorArgs,
		pageDashboardUniqueVisitorsSparkArgs,
	],
	component: DashboardUniqueVisitorsWidget,
	setup,
} );

generateReportBasedWidgetStories( {
	moduleSlug: [ 'analytics' ],
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Popular Pages Widget',
	data: dashboardPopularPagesData,
	options: dashboardPopularPagesArgs,
	component: DashboardPopularPagesWidget,
	wrapWidget: false,
	setup,
} );
