/**
 * DashboardAllTrafficWidgetGA4 Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	provideAnalyticsReportWithoutDateRangeData,
} from '@/js/modules/analytics-4/utils/data-mock';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { dateSub, DAY_IN_SECONDS } from '@/js/util';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as __fixtures__ from '@/js/modules/analytics-4/datastore/__fixtures__';
import { replaceValuesInAnalytics4ReportWithZeroData } from '@/js/util/zero-reports';
import DashboardAllTrafficWidgetGA4 from '.';
import {
	limitResponseToSingleDate,
	provideReportWithIncreasedOtherDimension,
} from './story-utils';

const widgetComponentProps = getWidgetComponentProps(
	'analyticsAllTraffic-widget'
);

function Template() {
	return <DashboardAllTrafficWidgetGA4 { ...widgetComponentProps } />;
}

const baseAllTrafficOptions = {
	startDate: '2020-12-09',
	endDate: '2021-01-05',
	compareStartDate: '2020-11-11',
	compareEndDate: '2020-12-08',
	metrics: [
		{
			name: 'totalUsers',
		},
	],
};

const allTrafficReportOptions = [
	{
		// Pie chart, with sessionDefaultChannelGrouping dimension.
		...baseAllTrafficOptions,
		dimensions: [ 'sessionDefaultChannelGrouping' ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		reportID: 'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
	},
	{
		// Pie chart, with country dimension.
		...baseAllTrafficOptions,
		dimensions: [ 'country' ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		reportID: 'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
	},
	{
		// Pie chart, with deviceCategory dimension.
		...baseAllTrafficOptions,
		dimensions: [ 'deviceCategory' ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 6,
		reportID: 'analytics-4_dashboard-all-traffic-widget-ga4_widget_pieArgs',
	},
	{
		// Totals.
		...baseAllTrafficOptions,
		reportID:
			'analytics-4_dashboard-all-traffic-widget-ga4_widget_totalsArgs',
	},
	{
		// Line chart.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
	},
	{
		// Line chart.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
		reportID:
			'analytics-4_dashboard-all-traffic-widget-ga4_widget_graphArgs',
	},
	{
		// Gathering data check.
		startDate: '2020-11-11',
		endDate: '2021-01-05',
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
	},
];

export const MainDashboardLoaded = Template.bind( {} );
MainDashboardLoaded.storyName = 'Loaded';
MainDashboardLoaded.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options, index ) => {
			if ( index === 0 ) {
				provideReportWithIncreasedOtherDimension( registry, options );
			} else {
				provideAnalytics4MockReport( registry, options );
			}
		} );
	},
};
MainDashboardLoaded.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400, // This extended delay is required to fix rare VRT instability where the chart in this scenario does not render in the standard delay.
};

export const MainDashboardLoading = Template.bind( {} );
MainDashboardLoading.storyName = 'Loading';
MainDashboardLoading.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] );
		} );
	},
};
MainDashboardLoading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
MainDashboardLoading.scenario = {};

export const MainDashboardDataUnavailable = Template.bind( {} );
MainDashboardDataUnavailable.storyName = 'Data Unavailable';
MainDashboardDataUnavailable.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } );

			// Set the property creation timestamp to one and a half days ago, so that
			// the property is considered to be in the gathering data state.
			const now = registry.select( CORE_USER ).getReferenceDate();
			const createTime = dateSub(
				now,
				1.5 * DAY_IN_SECONDS
			).toISOString();

			const property = {
				...__fixtures__.properties[ 0 ],
				createTime,
			};
			const propertyID = property._id;

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetProperty( property, { propertyID } );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setPropertyID( propertyID );
		} );
	},
};
MainDashboardDataUnavailable.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400, // This extended delay is required to fix rare VRT instability where the chart in this scenario does not render in the standard delay.
};

export const MainDashboardZeroData = Template.bind( {} );
MainDashboardZeroData.storyName = 'Zero Data';
MainDashboardZeroData.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport(
					replaceValuesInAnalytics4ReportWithZeroData(
						getAnalytics4MockResponse( options )
					),
					{
						options,
					}
				);
		} );

		// Set the property creation timestamp to two days ago, so that
		// the property is not considered to be in the gathering data state.
		const now = registry.select( CORE_USER ).getReferenceDate();
		const createTime = dateSub( now, 3 * DAY_IN_SECONDS ).toISOString();

		const property = {
			...__fixtures__.properties[ 0 ],
			createTime,
		};
		const propertyID = property._id;

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { propertyCreateTime: createTime } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
	},
};
MainDashboardZeroData.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400, // This extended delay is required to fix rare VRT instability where the chart in this scenario does not render in the standard delay.
};

export const MainDashboardError = Template.bind( {} );
MainDashboardError.storyName = 'Error';
MainDashboardError.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'missing_required_param',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};

		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, 'getReport', [ options ] );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );
	},
};
MainDashboardError.scenario = {};

export const MainDashboardOneRowOfData = Template.bind( {} );
MainDashboardOneRowOfData.storyName = 'One row of data';
MainDashboardOneRowOfData.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.slice( 0, 3 ).forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport(
					limitResponseToSingleDate(
						getAnalytics4MockResponse( options )
					),
					{ options }
				);
		} );

		allTrafficReportOptions.slice( 3 ).forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
		} );
	},
};
MainDashboardOneRowOfData.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400, // This extended delay is required to fix rare VRT instability where the chart in this scenario does not render in the standard delay.
};

export const NoDataInComparisonDateRange = Template.bind( {} );
NoDataInComparisonDateRange.storyName = 'NoDataInComparisonDateRange';
NoDataInComparisonDateRange.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalyticsReportWithoutDateRangeData( registry, options, {
				emptyRowBehavior: 'remove',
			} );
		} );
	},
};
NoDataInComparisonDateRange.scenario = {
	readySelector: '[id^="googlesitekit-chart-"] svg',
	delay: 400, // This extended delay is required to fix rare VRT instability where the chart in this scenario does not render in the standard delay.
};

export default {
	title: 'Modules/Analytics4/Widgets/All Traffic Widget GA4/Main Dashboard',
	component: DashboardAllTrafficWidgetGA4,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				// Activate the module.
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				// Set some site information.
				provideSiteInfo( registry );
				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-06' );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
