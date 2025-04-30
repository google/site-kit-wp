/**
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import ReturningVisitorsWidget from './ReturningVisitorsWidget';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../tests/js/utils/zeroReports';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../util/errors';

const reportOptions = {
	compareStartDate: '2020-07-14',
	compareEndDate: '2020-08-10',
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'newVsReturning' ],
	metrics: [
		{
			name: 'activeUsers',
		},
	],
};

const WidgetWithComponentProps = withWidgetComponentProps(
	'kmAnalyticsReturningVisitors'
)( ReturningVisitorsWidget );

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
		provideAnalytics4MockReport( registry, reportOptions );
	},
};
Ready.scenario = {
	label: 'KeyMetrics/ReturningVisitors/Ready',
	delay: 250,
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS_4 ).startResolution( 'getReport', [
			reportOptions,
		] );
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		const report = getAnalytics4MockResponse( reportOptions );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options: reportOptions,
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
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
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
			[ reportOptions ]
		);

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			reportOptions,
		] );
	},
};

export default {
	title: 'Key Metrics/ReturningVisitors',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
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
