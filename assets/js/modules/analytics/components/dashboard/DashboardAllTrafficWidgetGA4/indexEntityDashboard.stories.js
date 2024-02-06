/**
 * DashboardAllTrafficWidgetGA4 Component Stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
} from '../../../../analytics-4/utils/data-mock';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { DAY_IN_SECONDS } from '../../../../../util';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
import * as __fixtures__ from '../../../../analytics-4/datastore/__fixtures__';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../../.storybook/utils/zeroReports';
import DashboardAllTrafficWidgetGA4 from '.';

function limitResponseToSingleDate( analyticsResponse ) {
	const findFirstDateRangeRow = ( dateRange ) =>
		analyticsResponse.rows.find(
			( { dimensionValues } ) => dimensionValues[ 1 ].value === dateRange
		);

	return {
		...analyticsResponse,
		rows: [
			findFirstDateRangeRow( 'date_range_0' ),
			findFirstDateRangeRow( 'date_range_1' ),
		],
	};
}

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
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
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
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
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
		url: 'https://www.elasticpress.io/features/',
	},
	{
		// Totals.
		...baseAllTrafficOptions,
		url: 'https://www.elasticpress.io/features/',
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
		url: 'https://www.elasticpress.io/features/',
	},
	{
		// Gathering data check.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		url: 'https://www.elasticpress.io/features/',
	},
];

export const EntityDashboardLoaded = Template.bind( {} );
EntityDashboardLoaded.storyName = 'Loaded';
EntityDashboardLoaded.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
		} );
	},
};
EntityDashboardLoaded.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/Loaded',
};

export const EntityDashboardLoading = Template.bind( {} );
EntityDashboardLoading.storyName = 'Loading';
EntityDashboardLoading.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] );
		} );
	},
};
EntityDashboardLoading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
EntityDashboardLoading.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/Loading',
};

export const EntityDashboardDataUnavailable = Template.bind( {} );
EntityDashboardDataUnavailable.storyName = 'Data Unavailable';
EntityDashboardDataUnavailable.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } );
		} );

		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...__fixtures__.properties[ 0 ],
			createTime,
		};
		const propertyID = property._id;

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
	},
};
EntityDashboardDataUnavailable.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/DataUnavailable',
};

export const EntityDashboardZeroData = Template.bind( {} );
EntityDashboardZeroData.storyName = 'Zero Data';
EntityDashboardZeroData.args = {
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
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 3 * 1000
		).toISOString();

		const property = {
			...__fixtures__.properties[ 0 ],
			createTime,
		};
		const propertyID = property._id;

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( property, { propertyID } );

		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
	},
};
EntityDashboardZeroData.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/ZeroData',
};

export const EntityDashboardError = Template.bind( {} );
EntityDashboardError.storyName = 'Error';
EntityDashboardError.args = {
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
EntityDashboardError.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/Error',
};

export const EntityDashboardOneRowOfData = Template.bind( {} );
EntityDashboardOneRowOfData.storyName = 'One row of data';
EntityDashboardOneRowOfData.args = {
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
EntityDashboardOneRowOfData.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/EntityDashboard/OneRowOfData',
};

export default {
	title: 'Modules/Analytics/Widgets/All Traffic Widget GA4/Entity Dashboard',
	component: DashboardAllTrafficWidgetGA4,
	decorators: [
		( Story, { args } ) => {
			const registry = createTestRegistry();
			// Activate the module.
			provideModules( registry, [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
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

			provideSiteInfo( registry, {
				currentEntityURL: 'https://www.elasticpress.io/features/',
			} );

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
