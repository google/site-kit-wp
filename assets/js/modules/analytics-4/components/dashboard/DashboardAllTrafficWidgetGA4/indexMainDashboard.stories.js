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
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	WithTestRegistry,
} from '../../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../../utils/data-mock';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { dateSub, DAY_IN_SECONDS } from '../../../../../util';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import * as __fixtures__ from '../../../datastore/__fixtures__';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../../storybook/utils/zeroReports';
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
	},
	// Totals.
	baseAllTrafficOptions,
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
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Loaded',
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
MainDashboardLoading.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Loading',
};

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
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/DataUnavailable',
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
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/ZeroData',
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
MainDashboardError.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Error',
};

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
	label: 'Modules/Analytics4/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/OneRowOfData',
};

export default {
	title: 'Modules/Analytics4/Widgets/All Traffic Widget GA4/Main Dashboard',
	component: DashboardAllTrafficWidgetGA4,
	decorators: [
		( Story, { args } ) => {
			const registry = createTestRegistry();
			// Activate the module.
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			provideModuleRegistrations( registry );

			// Set some site information.
			provideSiteInfo( registry );
			provideUserAuthentication( registry );

			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-06' );

			// Call story-specific setup.
			args.setupRegistry( registry );

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
