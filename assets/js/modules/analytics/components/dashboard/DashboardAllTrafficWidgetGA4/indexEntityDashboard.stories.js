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
	provideModules,
	provideSiteInfo,
	WithTestRegistry,
} from '../../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../../../analytics-4/utils/data-mock';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS_4 } from '../../../../analytics-4/datastore/constants';
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

const Template = () => (
	<DashboardAllTrafficWidgetGA4 { ...widgetComponentProps } />
);

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
		...baseAllTrafficOptions,
		dimensions: [ 'sessionDefaultChannelGrouping' ],
		orderby: {
			fieldName: 'totalUsers',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
	},
	{
		...baseAllTrafficOptions,
		dimensions: [ 'country' ],
		orderby: {
			fieldName: 'totalUsers',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
	},
	{
		...baseAllTrafficOptions,
		dimensions: [ 'deviceCategory' ],
		orderby: {
			fieldName: 'totalUsers',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
		url: 'https://www.elasticpress.io/features/',
	},
	{
		...baseAllTrafficOptions,
		url: 'https://www.elasticpress.io/features/',
	},
	{
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

		allTrafficReportOptions.slice( 3, 5 ).forEach( ( options ) => {
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
			] );

			// Set some site information.
			provideSiteInfo( registry );

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
