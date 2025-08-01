/**
 * TopTrafficSourceWidget Component Stories.
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
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import TopTrafficSourceWidget from './TopTrafficSourceWidget';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../constants';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	provideAnalyticsReportWithoutDateRangeData,
} from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../tests/js/utils/zeroReports';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';

const reportOptions = [
	{
		compareStartDate: '2020-07-14',
		compareEndDate: '2020-08-10',
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		reportID:
			'analytics-4_top-traffic-source-widget_widget_totalUsersReportOptions',
	},
	{
		compareStartDate: '2020-07-14',
		compareEndDate: '2020-08-10',
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		limit: 1,
		orderBy: 'totalUsers',
		reportID:
			'analytics-4_top-traffic-source-widget_widget_trafficSourceReportOptions',
	},
];

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsTopTrafficSource'
)( TopTrafficSourceWidget );

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		reportOptions.forEach( ( options ) =>
			provideAnalytics4MockReport( registry, options )
		);
	},
};
Ready.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions[ 0 ],
		] );
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions[ 1 ],
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		reportOptions.forEach( ( options ) => {
			dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
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

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 400,
			message: 'Test error message. ',
			data: {
				status: 400,
				reason: 'badRequest',
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ reportOptions[ 1 ] ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions[ 1 ],
		] );
	},
};

export const InsufficientPermissions = Template.bind( {} );
InsufficientPermissions.storyName = 'Insufficient Permissions';
InsufficientPermissions.args = {
	setupRegistry: ( { dispatch } ) => {
		const errorObject = {
			code: 403,
			message: 'Test error message. ',
			data: {
				status: 403,
				reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS,
			},
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveError(
			errorObject,
			'getReport',
			[ reportOptions[ 1 ] ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions[ 1 ],
		] );
	},
};

export const NoDataInComparisonDateRange = Template.bind( {} );
NoDataInComparisonDateRange.storyName = 'NoDataInComparisonDateRange';
NoDataInComparisonDateRange.args = {
	setupRegistry: ( registry ) => {
		provideAnalyticsReportWithoutDateRangeData(
			registry,
			reportOptions[ 0 ]
		);
		provideAnalyticsReportWithoutDateRangeData(
			registry,
			reportOptions[ 1 ],
			{ emptyRowBehavior: 'remove' }
		);
	},
};
NoDataInComparisonDateRange.scenario = {};

export default {
	title: 'Key Metrics/TopTrafficSource',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				const [ accountID, propertyID, webDataStreamID ] = [
					'12345',
					'34567',
					'56789',
				];

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setWebDataStreamID( webDataStreamID );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideKeyMetrics( registry );

				// Call story-specific setup.
				args.setupRegistry( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
