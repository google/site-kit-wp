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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

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

import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
} from '../tests/js/utils';

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	data: dashboardAllTrafficData,
	options: dashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
	wrapWidget: false,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	data: pageDashboardAllTrafficData,
	options: pageDashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
	wrapWidget: false,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Bounce Rate Widget',
	data: dashboardBounceRateWidgetData,
	options: dashboardBounceRateWidgetArgs,
	component: DashboardBounceRateWidget,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Bounce Rate Widget',
	data: pageDashboardBounceRateWidgetData,
	options: pageDashboardBounceRateWidgetArgs,
	component: DashboardBounceRateWidget,
} );

storiesOf( 'Analytics Module/Components/Dashboard/Goals Widget', module )
	.addDecorator( ( storyFn ) => {
		const registry = createTestRegistry();
		const [ property ] = accountsPropertiesProfiles.properties;
		provideModules( registry, [ {
			slug: 'analytics',
			active: true,
			connected: true,
		} ] );

		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setAccountID( property.accountId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setInternalWebPropertyID( property.internalWebPropertyId );
		// eslint-disable-next-line sitekit/camelcase-acronyms
		registry.dispatch( STORE_NAME ).setProfileID( property.defaultProfileId );

		return storyFn( registry );
	} )
	.add( 'Loaded', ( registry ) => {
		const { dispatch } = registry;
		dispatch( STORE_NAME ).receiveGetReport( dashboardGoalsWidgetData, { options: dashboardGoalsWidgetArgs } );
		dispatch( STORE_NAME ).receiveGetGoals( goals );
		return (
			<WithTestRegistry registry={ registry }>
				<DashboardGoalsWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Data Unavailable', ( registry ) => {
		const { dispatch } = registry;
		dispatch( STORE_NAME ).receiveGetReport( [], { options: dashboardGoalsWidgetArgs } );
		dispatch( STORE_NAME ).receiveGetGoals( goals );
		return (
			<WithTestRegistry registry={ registry }>
				<DashboardGoalsWidget />
			</WithTestRegistry>
		);
	} )
	.add( 'Error', ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};
		const { dispatch } = registry;
		dispatch( STORE_NAME ).receiveError( error, 'getReport', [ dashboardGoalsWidgetArgs ] );
		dispatch( STORE_NAME ).finishResolution( 'getReport', [ dashboardGoalsWidgetArgs ] );
		return (
			<WithTestRegistry registry={ registry }>
				<DashboardGoalsWidget />
			</WithTestRegistry>
		);
	} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
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
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
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
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Popular Pages Widget',
	data: dashboardPopularPagesData,
	options: dashboardPopularPagesArgs,
	component: DashboardPopularPagesWidget,
	wrapWidget: false,
} );
