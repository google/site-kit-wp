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
import DashboardBounceRateWidget from '../assets/js/modules/analytics/components/dashboard/DashboardBounceRateWidget';
import DashboardGoalsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardGoalsWidget';
import DashboardUniqueVisitorsWidget from '../assets/js/modules/analytics/components/dashboard/DashboardUniqueVisitorsWidget';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore';
import {
	goals,
	dashboardAllTrafficArgs,
	dashboardAllTrafficData,
	pageDashboardAllTrafficArgs,
	pageDashboardAllTrafficData,
	dashboardBounceRateWidgetArgs,
	dashboardBounceRateWidgetData,
	dashboardGoalsWidgetArgs,
	dashboardGoalsWidgetData,
	dashboardUniqueVisitorsSparkArgs,
	dashboardUniqueVisitorsVisitorArgs,
	dashboardUniqueVisitorsSparkData,
	dashboardUniqueVisitorsVisitorData,
} from '../assets/js/modules/analytics/datastore/__fixtures__';

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/All Traffic Widget',
	data: dashboardAllTrafficData,
	options: dashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/All Traffic Widget',
	data: pageDashboardAllTrafficData,
	options: pageDashboardAllTrafficArgs,
	component: DashboardAllTrafficWidget,
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
	data: dashboardBounceRateWidgetData,
	options: dashboardBounceRateWidgetArgs,
	component: DashboardBounceRateWidget,
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Goals Widget',
	data: dashboardGoalsWidgetData,
	options: dashboardGoalsWidgetArgs,
	component: DashboardGoalsWidget,
	variantCallbacks: {
		Loaded: ( dispatch, data, options ) => {
			dispatch( STORE_NAME ).receiveGetReport( data, { options } );
			dispatch( STORE_NAME ).receiveGetGoals( goals );
		},
		'Data Unavailable': ( dispatch ) => {
			dispatch( STORE_NAME ).receiveGetGoals( goals );
		},
	},
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Goals Widget',
	data: dashboardGoalsWidgetData,
	options: dashboardGoalsWidgetArgs,
	component: DashboardGoalsWidget,
	variantCallbacks: {
		Loaded: ( dispatch, data, options ) => {
			dispatch( STORE_NAME ).receiveGetReport( data, { options } );
			dispatch( STORE_NAME ).receiveGetGoals( goals );
		},
		'Data Unavailable': ( dispatch ) => {
			dispatch( STORE_NAME ).receiveGetGoals( goals );
		},
	},
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Dashboard/Unique Visitors Widget',
	data: {
		visitorData: dashboardUniqueVisitorsVisitorData,
		sparkData: dashboardUniqueVisitorsSparkData,
	},
	options: {
		visitorArgs: dashboardUniqueVisitorsVisitorArgs,
		sparkArgs: dashboardUniqueVisitorsSparkArgs,
	},
	component: DashboardUniqueVisitorsWidget,
	variantCallbacks: {
		Loaded: ( dispatch, data, options ) => {
			const { visitorData, sparkData } = data;
			const { visitorArgs, sparkArgs } = options;
			dispatch( STORE_NAME ).receiveGetReport( visitorData, { options: visitorArgs } );
			dispatch( STORE_NAME ).receiveGetReport( sparkData, { options: sparkArgs } );
		},
		'Data Unavailable': ( dispatch, data, options ) => {
			const { visitorArgs, sparkArgs } = options;
			dispatch( STORE_NAME ).receiveGetReport( [], { options: visitorArgs } );
			dispatch( STORE_NAME ).receiveGetReport( [], { options: sparkArgs } );
		},
		Error: ( dispatch, data, options ) => {
			const { visitorArgs, sparkArgs } = options;
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ visitorArgs ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ visitorArgs ] );
		},
	},
} );

generateReportBasedWidgetStories( {
	moduleSlug: 'analytics',
	datastore: STORE_NAME,
	group: 'Analytics Module/Components/Page Dashboard/Unique Visitors Widget',
	data: {
		visitorData: dashboardUniqueVisitorsVisitorData,
		sparkData: dashboardUniqueVisitorsSparkData,
	},
	options: {
		visitorArgs: dashboardUniqueVisitorsVisitorArgs,
		sparkArgs: dashboardUniqueVisitorsSparkArgs,
	},
	component: DashboardUniqueVisitorsWidget,
	variantCallbacks: {
		Loaded: ( dispatch, data, options ) => {
			const { visitorData, sparkData } = data;
			const { visitorArgs, sparkArgs } = options;
			dispatch( STORE_NAME ).receiveGetReport( visitorData, { options: visitorArgs } );
			dispatch( STORE_NAME ).receiveGetReport( sparkData, { options: sparkArgs } );
		},
		'Data Unavailable': ( dispatch, data, options ) => {
			const { visitorArgs, sparkArgs } = options;
			dispatch( STORE_NAME ).receiveGetReport( [], { options: visitorArgs } );
			dispatch( STORE_NAME ).receiveGetReport( [], { options: sparkArgs } );
		},
		Error: ( dispatch, data, options ) => {
			const { visitorArgs, sparkArgs } = options;
			const error = {
				code: 'missing_required_param',
				message: 'Request parameter is empty: metrics.',
				data: {},
			};

			dispatch( STORE_NAME ).receiveError( error, 'getReport', [ visitorArgs ] );
			dispatch( STORE_NAME ).finishResolution( 'getReport', [ visitorArgs ] );
		},
	},
} );
