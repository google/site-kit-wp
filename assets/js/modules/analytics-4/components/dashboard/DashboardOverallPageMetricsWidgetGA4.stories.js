/**
 * DashboardOverallPageMetricsWidgetGA4 Component Stories.
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '../../constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../tests/js/utils/zeroReports';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	provideAnalyticsReportWithoutDateRangeData,
} from '../../utils/data-mock';
import { properties } from '../../datastore/__fixtures__';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { DAY_IN_SECONDS } from '../../../../util';
import DashboardOverallPageMetricsWidgetGA4 from './DashboardOverallPageMetricsWidgetGA4';

const gatheringReportOptions = {
	dimensions: [ 'date' ],
	metrics: [ { name: 'totalUsers' } ],
	startDate: '2020-07-14',
	endDate: '2020-09-07',
};

const reportOptions = [
	{
		compareStartDate: '2020-07-14',
		compareEndDate: '2020-08-10',
		startDate: '2020-08-11',
		endDate: '2020-09-07',
		dimensions: [ 'date' ],
		metrics: [
			{
				name: 'screenPageViews',
			},
			{
				name: 'sessions',
			},
			{
				name: 'engagementRate',
			},
			{
				name: 'averageSessionDuration',
			},
		],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
		url: null,
		reportID: 'analytics-4_dashboard-overall-page-metrics-widget-args',
	},
	{
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-07-14',
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
	DashboardOverallPageMetricsWidgetGA4
);

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
		for ( const options of reportOptions ) {
			provideAnalytics4MockReport( registry, options );
		}
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
	},
};
Loading.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];
Loading.scenario = {};

export const DataUnavailable = Template.bind( {} );
DataUnavailable.storyName = 'Data Unavailable';
DataUnavailable.args = {
	setupRegistry: ( { dispatch } ) => {
		const propertyID = properties[ 0 ]._id;
		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...properties[ 0 ],
			createTime,
		};

		dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty( property, {
			propertyID,
		} );
		dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			replaceValuesInAnalytics4ReportWithZeroData(
				getAnalytics4MockResponse( gatheringReportOptions )
			),
			{
				options: gatheringReportOptions,
			}
		);

		for ( const options of reportOptions ) {
			dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				replaceValuesInAnalytics4ReportWithZeroData(
					getAnalytics4MockResponse( options )
				),
				{ options }
			);
		}
	},
};
DataUnavailable.scenario = {};

export const ZeroData = Template.bind( {} );
ZeroData.storyName = 'Zero Data';
ZeroData.args = {
	setupRegistry: ( { dispatch } ) => {
		const propertyID = properties[ 0 ]._id;
		dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		dispatch( MODULES_ANALYTICS_4 ).setPropertyCreateTime(
			properties[ 0 ].createTime
		);

		for ( const options of reportOptions ) {
			const report = getAnalytics4MockResponse( options );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				replaceValuesInAnalytics4ReportWithZeroData( report ),
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
			message: 'Error message.',
			data: {},
		};
		const options = reportOptions[ 0 ];

		dispatch( MODULES_ANALYTICS_4 ).receiveError( error, 'getReport', [
			options,
		] );

		dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getReport', [
			options,
		] );
	},
};
Error.scenario = {};

export const LoadedEntityURL = Template.bind( {} );
LoadedEntityURL.storyName = 'Ready w/ entity URL set';
LoadedEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalytics4MockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		for ( const options of reportOptionsWithEntity ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};

export const LoadingEntityURL = Template.bind( {} );
LoadingEntityURL.storyName = 'Loading w/ entity URL';
LoadingEntityURL.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalytics4MockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ reportOptionsWithEntity[ 0 ] ] );
	},
};
LoadingEntityURL.decorators = [
	( Story ) => {
		// Ensure the animation is paused for VRT tests to correctly capture the loading state.
		return (
			<div className="googlesitekit-vrt-animation-paused">
				<Story />
			</div>
		);
	},
];

export const DataUnavailableEntityURL = Template.bind( {} );
DataUnavailableEntityURL.storyName = 'Data Unavailable w/ entity URL';
DataUnavailableEntityURL.args = {
	setupRegistry: ( registry ) => {
		const propertyID = properties[ 0 ]._id;
		// Set the property creation timestamp to one and a half days ago, so that
		// the property is considered to be in the gathering data state.
		const createTime = new Date(
			Date.now() - DAY_IN_SECONDS * 1.5 * 1000
		).toISOString();

		const property = {
			...properties[ 0 ],
			createTime,
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperty( property, {
			propertyID,
		} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		provideSiteInfo( registry, { currentEntityURL } );

		const options = {
			...gatheringReportOptions,
			url: currentEntityURL,
		};

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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				replaceValuesInAnalytics4ReportWithZeroData(
					getAnalytics4MockResponse( reportOptionsWithEntity[ 0 ] )
				),
				{ options: reportOptionsWithEntity[ 0 ] }
			);
	},
};

export const ZeroDataEntityURL = Template.bind( {} );
ZeroDataEntityURL.storyName = 'Zero Data w/ entity URL';
ZeroDataEntityURL.args = {
	setupRegistry: ( registry ) => {
		const propertyID = properties[ 0 ]._id;
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( properties[ 0 ].createTime );

		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalytics4MockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		for ( const options of reportOptionsWithEntity ) {
			const report = getAnalytics4MockResponse( options );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport(
					replaceValuesInAnalytics4ReportWithZeroData( report ),
					{
						options,
					}
				);
		}
	},
};

export const ErrorEntityURL = Template.bind( {} );
ErrorEntityURL.storyName = 'Error w/ entity URL';
ErrorEntityURL.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error with entity URL set.',
			data: {},
		};

		provideSiteInfo( registry, { currentEntityURL } );
		provideAnalytics4MockReport( registry, {
			...gatheringReportOptions,
			url: currentEntityURL,
		} );

		const options = reportOptionsWithEntity[ 0 ];
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	},
};

export const LongDataValues = Template.bind( {} );
LongDataValues.storyName = 'Long Data Values';
LongDataValues.args = {
	setupRegistry: ( registry ) => {
		const extremeReport = getAnalytics4MockResponse( reportOptions[ 0 ] );

		if ( extremeReport.rows && extremeReport.rows.length ) {
			// Set extremely large values for metrics to test limits of the DataBlockGroup resizing logic.
			extremeReport.totals[ 0 ].metricValues = [
				{ value: '9876543210' },
				{ value: '8765432109' },
				{ value: '0.9999' },
				{ value: '54321.9876' },
			];
		}

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( extremeReport, { options: reportOptions[ 0 ] } );
	},
};
LongDataValues.scenario = {
	resetDataBlockGroup: true,
	waitForFontSizeToMatch: '.googlesitekit-data-block__datapoint',
	// Once #10798 is implemented we can have story level viewports which better
	// capture sizes at each flexbox reflow that cause font size changes.
	fontSizeLarge: 41,
	fontSizeMedium: false, // No resizing occurs at this viewport.
	fontSizeSmall: 27,
};

export const NoDataInComparisonDateRange = Template.bind( {} );
NoDataInComparisonDateRange.storyName = 'NoDataInComparisonDateRange';
NoDataInComparisonDateRange.args = {
	setupRegistry: ( registry ) => {
		provideAnalyticsReportWithoutDateRangeData(
			registry,
			reportOptions[ 0 ]
		);
	},
};
NoDataInComparisonDateRange.scenario = {};

export default {
	title: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );

				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideAnalytics4MockReport( registry, gatheringReportOptions );

				// Call story-specific setup.
				args.setupRegistry( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
