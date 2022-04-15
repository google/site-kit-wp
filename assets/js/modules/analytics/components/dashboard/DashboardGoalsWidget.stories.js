/**
 * DashboardGoalsWidget Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import { replaceValuesInAnalyticsReportWithZeroData } from '../../../../../../.storybook/utils/zeroReports';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	provideAnalyticsMockReport,
	getAnalyticsMockResponse,
} from '../../util/data-mock';
import { goals } from '../../datastore/__fixtures__';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardGoalsWidget from './DashboardGoalsWidget';

const gatheringReportOptions = {
	dimensions: [ 'ga:date' ],
	metrics: [ { expression: 'ga:users' } ],
	startDate: '2020-12-02',
	endDate: '2020-12-29',
};

const reportOptions = [
	{
		compareStartDate: '2020-11-04',
		compareEndDate: '2020-12-01',
		startDate: '2020-12-02',
		endDate: '2020-12-29',
		dimensions: 'ga:date',
		metrics: [
			{
				expression: 'ga:goalCompletionsAll',
				alias: 'Goal Completions',
			},
		],
	},
	{
		compareStartDate: '2020-11-04',
		compareEndDate: '2020-12-01',
		startDate: '2020-12-02',
		endDate: '2020-12-29',
		url: null,
		metrics: [
			{
				expression: 'ga:users',
				alias: 'Total Users',
			},
		],
	},
];

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	DashboardGoalsWidget
);

const Template = ( { setupRegistry, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<WidgetWithComponentProps { ...args } />
	</WithRegistrySetup>
);

export const Ready = Template.bind( {} );
Ready.storyName = 'Ready';
Ready.args = {
	setupRegistry: ( registry ) => {
		for ( const options of reportOptions ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS ).startResolution( 'getReport', [
			reportOptions[ 0 ],
		] );
	},
};

export const DataUnavailable = Template.bind( {} );
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS ).receiveGetReport( [], {
			options: gatheringReportOptions,
		} );

		for ( const options of reportOptions ) {
			dispatch( MODULES_ANALYTICS ).receiveGetReport( [], { options } );
		}
	},
};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		for ( const options of reportOptions ) {
			const report = getAnalyticsMockResponse( options );

			dispatch( MODULES_ANALYTICS ).receiveGetReport(
				replaceValuesInAnalyticsReportWithZeroData( report ),
				{
					options,
				}
			);
		}
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const error = {
			code: 'test_error',
			message: 'Request parameter is empty: metrics.',
			data: {},
		};
		const options = reportOptions[ 0 ];

		dispatch( MODULES_ANALYTICS ).receiveError( error, 'getReport', [
			options,
		] );

		dispatch( MODULES_ANALYTICS ).finishResolution( 'getReport', [
			options,
		] );
	},
};

export const GatheringDataZeroDataStates = Template.bind( {} );
GatheringDataZeroDataStates.storyName = 'Gathering Data w/ zeroDataStates';
GatheringDataZeroDataStates.args = {
	setupRegistry: ( { dispatch } ) => {
		dispatch( MODULES_ANALYTICS ).receiveGetReport(
			{},
			{
				options: gatheringReportOptions,
			}
		);

		for ( const options of reportOptions ) {
			dispatch( MODULES_ANALYTICS ).receiveGetReport( {}, { options } );
		}
	},
};
GatheringDataZeroDataStates.parameters = {
	features: [ 'zeroDataStates' ],
};

export default {
	title: 'Modules/Analytics/Widgets/DashboardGoalsWidget',
	decorators: [
		( Story ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<Story />
				</div>
			</div>
		),
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics',
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-12-30' );
				registry.dispatch( MODULES_ANALYTICS ).receiveGetGoals( goals );

				provideAnalyticsMockReport( registry, gatheringReportOptions );

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
