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
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../storybook/utils/zeroReports';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../utils/data-mock';
import { properties } from '../../datastore/__fixtures__';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { DAY_IN_SECONDS } from '../../../../util';
import DashboardOverallPageMetricsWidgetGA4 from './DashboardOverallPageMetricsWidgetGA4';

const gatheringReportOptions = {
	dimensions: [ 'date' ],
	metrics: [ { name: 'totalUsers' } ],
	startDate: '2020-08-11',
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
	},
	{
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
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
Ready.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/Ready',
	delay: 500,
};

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
Loading.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/Loading',
};

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
DataUnavailable.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/DataUnavailable',
};

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
ZeroData.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/ZeroData',
	delay: 500,
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
Error.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/Error',
};

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
LoadedEntityURL.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/LoadedEntityURL',
	delay: 1500, // Allow extra time for responsive text in mobile.
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
LoadingEntityURL.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/LoadingEntityURL',
};

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
DataUnavailableEntityURL.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/DataUnavailableEntityURL',
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
ZeroDataEntityURL.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/ZeroDataEntityURL',
	delay: 500,
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
ErrorEntityURL.scenario = {
	label: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4/ErrorEntityURL',
};

export default {
	title: 'Modules/Analytics4/Widgets/DashboardOverallPageMetricsWidgetGA4',
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

				provideUserAuthentication( registry );

				registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );

				provideAnalytics4MockReport( registry, gatheringReportOptions );

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
