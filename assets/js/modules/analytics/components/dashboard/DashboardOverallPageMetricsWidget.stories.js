/**
 * DashboardOverallPageMetricsWidget Component Stories.
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
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../tests/js/utils';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	provideAnalyticsMockReport,
	getAnalyticsMockResponse,
} from '../../util/data-mock';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import DashboardOverallPageMetricsWidget from './DashboardOverallPageMetricsWidget';

function zeroing( report ) {
	const zeroValues = ( { values } ) => ( {
		values: values.map( () => 0 ),
	} );

	return report.map( ( single ) => ( {
		...single,
		data: {
			...single.data,
			totals: single.data.totals.map( zeroValues ),
			maximums: single.data.maximums.map( zeroValues ),
			minimums: single.data.minimums.map( zeroValues ),
			rows: single.data.rows.map( ( { dimensions, metrics } ) => ( {
				dimensions,
				metrics: metrics.map( zeroValues ),
			} ) ),
		},
	} ) );
}

const gatheringReportOptions = {
	dimensions: [ 'ga:date' ],
	metrics: [ { expression: 'ga:users' } ],
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	// url: 'https://www.sitekit.com/',
};

const reportOptions = [
	{
		compareStartDate: '2020-07-14',
		compareEndDate: '2020-08-10',
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce Rate',
			},
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Session Duration',
			},
		],
		url: null,
	},
	{
		dimensions: [ 'ga:date' ],
		metrics: [ { expression: 'ga:users' } ],
		startDate: '2020-08-11',
		endDate: '2020-09-07',
	},
];
const currentEntityURL = 'https://www.example.com/example-page/';
const reportOptionsWithEntity = reportOptions.map( ( options ) => {
	return {
		...options,
		url: currentEntityURL,
	};
} );

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	DashboardOverallPageMetricsWidget
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

			dispatch( MODULES_ANALYTICS ).receiveGetReport( zeroing( report ), {
				options,
			} );
		}
	},
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( { dispatch } ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
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
GatheringDataZeroDataStates.storyName =
	'Gathering Data with zeroDataStates feature flag enabled';
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

export const GatheringDataZeroDataStatesDisabled = Template.bind( {} );
GatheringDataZeroDataStatesDisabled.storyName =
	'Gathering Data with zeroDataStates feature flag disabled';
GatheringDataZeroDataStatesDisabled.args = {
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

export const LoadedEntityURL = Template.bind( {} );
LoadedEntityURL.storyName = 'Ready with entity URL set';
LoadedEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalyticsMockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		for ( const options of reportOptionsWithEntity ) {
			provideAnalyticsMockReport( registry, options );
		}
	},
};

export const LoadingEntityURL = Template.bind( {} );
LoadingEntityURL.storyName = 'Loading with entity URL set';
LoadingEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalyticsMockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		registry
			.dispatch( MODULES_ANALYTICS )
			.startResolution( 'getReport', [ reportOptionsWithEntity[ 0 ] ] );
	},
};

export const DataUnavailableEntityURL = Template.bind( {} );
DataUnavailableEntityURL.storyName = 'Data Unavailable with entity URL set';
DataUnavailableEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );

		registry.dispatch( MODULES_ANALYTICS ).receiveGetReport( [], {
			options: {
				...gatheringReportOptions,
				url: currentEntityURL,
			},
		} );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetReport( [], { options: reportOptionsWithEntity[ 0 ] } );
	},
};

export const ZeroDataEntityURL = Template.bind( {} );
ZeroDataEntityURL.storyName = 'Zero Data with entity URL set';
ZeroDataEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalyticsMockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		for ( const options of reportOptionsWithEntity ) {
			const report = getAnalyticsMockResponse( options );

			registry
				.dispatch( MODULES_ANALYTICS )
				.receiveGetReport( zeroing( report ), {
					options,
				} );
		}
	},
};

export const ErrorEntityURL = Template.bind( {} );
ErrorEntityURL.storyName = 'Error with entity URL set';
ErrorEntityURL.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error with entity URL set.',
			data: {},
		};

		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalyticsMockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		const options = reportOptionsWithEntity[ 0 ];
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveError( error, 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS )
			.finishResolution( 'getReport', [ options ] );
	},
};

export const GatheringDataEntityURLZeroDataStates = Template.bind( {} );
GatheringDataEntityURLZeroDataStates.storyName =
	'Gathering Data with entity URL set and zeroDataStates feature flag enabled';
GatheringDataEntityURLZeroDataStates.args = {
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
GatheringDataEntityURLZeroDataStates.parameters = {
	features: [ 'zeroDataStates' ],
};

export const GatheringDataEntityURLZeroDataStatesDisabled = Template.bind( {} );
GatheringDataEntityURLZeroDataStatesDisabled.storyName =
	'Gathering Data with entity URL set and zeroDataStates feature flag disabled';
GatheringDataEntityURLZeroDataStatesDisabled.args = {
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

export default {
	title: 'Modules/Analytics/Widgets/DashboardOverallPageMetricsWidget',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics',
					},
				] );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

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
