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
	getAnalyticsMockResponse,
	provideAnalyticsMockReport,
} from '../../../util/data-mock';
import { provideAnalytics4MockReport } from '../../../../analytics-4/utils/data-mock';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
import { replaceValuesInAnalyticsReportWithZeroData } from '../../../../../../../.storybook/utils/zeroReports';
import DashboardAllTrafficWidgetGA4 from './index';

// FIXME: Extract/reuse? See stories/module-analytics-components.stories.js.
// Used to modify an Analytics response to only include a single row,
// e.g. if no more than one value of the dimension is available.
function limitResponseToSingleRow( analyticsResponse ) {
	return [
		{
			...analyticsResponse[ 0 ],
			data: {
				...analyticsResponse[ 0 ].data,
				rows: [ analyticsResponse[ 0 ].data.rows[ 0 ] ],
			},
		},
	];
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
	},
	{
		...baseAllTrafficOptions,
		dimensions: [ 'country' ],
		orderby: {
			fieldName: 'totalUsers',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	{
		...baseAllTrafficOptions,
		dimensions: [ 'deviceCategory' ],
		orderby: {
			fieldName: 'totalUsers',
			sortOrder: 'DESCENDING',
		},
		limit: 6,
	},
	baseAllTrafficOptions,
	{
		startDate: '2020-12-09',
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
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalytics4MockReport( registry, options );
		} );
	},
};
MainDashboardLoaded.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Loaded',
};

export const MainDashboardLoading = Template.bind( {} );
MainDashboardLoading.storyName = 'Loading';
MainDashboardLoading.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			provideAnalyticsMockReport( registry, options );
			registry
				.dispatch( MODULES_ANALYTICS )
				.startResolution( 'getReport', [ options ] );
		} );
	},
};
MainDashboardLoading.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Loading',
};

export const MainDashboardDataUnavailable = Template.bind( {} );
MainDashboardDataUnavailable.storyName = 'Data Unavailable';
MainDashboardDataUnavailable.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport( [], { options } );
		} );
	},
};
MainDashboardDataUnavailable.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/DataUnavailable',
};

export const MainDashboardZeroData = Template.bind( {} );
MainDashboardZeroData.storyName = 'Zero Data';
MainDashboardZeroData.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport(
					replaceValuesInAnalyticsReportWithZeroData(
						getAnalyticsMockResponse( options )
					),
					{
						options,
					}
				);
		} );
	},
};
MainDashboardZeroData.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/ZeroData',
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
				.dispatch( MODULES_ANALYTICS )
				.receiveError( error, 'getReport', [ options ] );
			registry
				.dispatch( MODULES_ANALYTICS )
				.finishResolution( 'getReport', [ options ] );
		} );
	},
};
MainDashboardError.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/Error',
};

export const MainDashboardOneRowOfData = Template.bind( {} );
MainDashboardOneRowOfData.storyName = 'One row of data';
MainDashboardOneRowOfData.args = {
	setupRegistry: ( registry ) => {
		allTrafficReportOptions.slice( 0, 3 ).forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport(
					limitResponseToSingleRow(
						getAnalyticsMockResponse( options )
					),
					{ options }
				);
		} );

		allTrafficReportOptions.slice( 3, 5 ).forEach( ( options ) => {
			provideAnalyticsMockReport( registry, options );
		} );
	},
};
MainDashboardOneRowOfData.scenario = {
	label: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4/MainDashboard/OneRowOfData',
};

export default {
	title: 'Modules/Analytics/Widgets/DashboardAllTrafficWidgetGA4',
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

			// TODO: Entity Dashboard versions.
			// provideSiteInfo( registry, {
			// 	currentEntityURL,
			// } );

			registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-06' );

			// Call story-specific setup.
			args.setupRegistry( registry );

			return (
				<WithTestRegistry
					registry={ registry }
					// features={ [ 'ga4Reporting' ] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
