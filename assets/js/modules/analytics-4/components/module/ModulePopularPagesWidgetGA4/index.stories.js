/**
 * ModulePopularPagesWidgetGA4 Component Stories.
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
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../../tests/js/utils';
import {
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
	STRATEGY_ZIP,
} from '../../../utils/data-mock';
import { properties } from '../../../datastore/__fixtures__';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import { DAY_IN_SECONDS } from '../../../../../util';
import { withWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import ModulePopularPagesWidgetGA4 from '.';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../../../../storybook/utils/zeroReports';

const reportOptions = [
	{
		// Popular pages report.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensions: [ 'pagePath' ],
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
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 10,
	},
	{
		// Page titles report.
		startDate: '2020-12-09',
		endDate: '2021-01-05',
		dimensionFilters: {
			pagePath: new Array( 10 )
				.fill( '' )
				.map( ( _, i ) => `/test-post-${ i + 1 }/` )
				.sort(),
		},
		dimensions: [ 'pagePath', 'pageTitle' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [ { metric: { metricName: 'screenPageViews' }, desc: true } ],
		limit: 50,
	},
	{
		// Gathering/zero data report.
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-11-11',
		endDate: '2021-01-05',
	},
];

const WidgetWithComponentProps = withWidgetComponentProps( 'widget-slug' )(
	ModulePopularPagesWidgetGA4
);

function Template( { setupRegistry, ...args } ) {
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<WidgetWithComponentProps { ...args } />
		</WithRegistrySetup>
	);
}

export const Loaded = Template.bind( {} );
Loaded.storyName = 'Loaded';
Loaded.args = {
	setupRegistry: ( registry ) => {
		const pageTitlesReportOptions = reportOptions[ 1 ];

		const pageTitlesReport = getAnalytics4MockResponse(
			pageTitlesReportOptions,
			// Use the zip combination strategy to ensure a one-to-one mapping of page paths to page titles.
			// Otherwise, by using the default cartesian product of dimension values, the resulting output will have non-matching
			// page paths to page titles.
			{ dimensionCombinationStrategy: STRATEGY_ZIP }
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( pageTitlesReport, {
				options: pageTitlesReportOptions,
			} );

		for ( const options of [ reportOptions[ 0 ], reportOptions[ 2 ] ] ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};
Loaded.scenario = {
	label: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4/Loaded',
	delay: 250,
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
	label: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4/Loading',
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

		const gatheringReportOptions = reportOptions[ 2 ];

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
	label: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4/DataUnavailable',
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
	label: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4/ZeroData',
	delay: 250,
};

export const Error = Template.bind( {} );
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		const error = {
			code: 'test_error',
			message: 'Error message.',
			data: {},
		};
		const reportArgs = [ reportOptions[ 0 ] ];

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', reportArgs );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', reportArgs );

		for ( const options of reportOptions.slice( 1 ) ) {
			provideAnalytics4MockReport( registry, options );
		}
	},
};
Error.scenario = {
	label: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4/Error',
};

export default {
	title: 'Modules/Analytics4/Widgets/ModulePopularPagesWidgetGA4',
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

				registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-06' );

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
