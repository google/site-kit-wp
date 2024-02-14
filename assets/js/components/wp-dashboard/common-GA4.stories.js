/**
 * Shared exports among WPDashboard GA4 Stories.
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
import { provideModules, provideSiteInfo } from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import {
	STRATEGY_ZIP,
	getAnalytics4MockResponse,
	provideAnalytics4MockReport,
} from '../../modules/analytics-4/utils/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../.storybook/utils/zeroReports';
import { DAY_IN_SECONDS } from '../../util';
import * as __fixtures__ from '../../modules/analytics-4/datastore/__fixtures__';
import { provideSearchConsoleMockReport } from '../../modules/search-console/util/data-mock';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';

const wpDashboardSearchConsoleOptions = {
	startDate: '2020-12-03',
	endDate: '2021-01-27',
	dimensions: 'date',
};

export const wpDashboardAnalytics4OptionSets = [
	// Mock options for mocking isGatheringData selector's response.
	{
		dimensions: [ 'date' ],
		metrics: [ { name: 'totalUsers' } ],
		startDate: '2020-12-31',
		endDate: '2021-01-27',
	},

	// Mock options for mocking "Total Unique Visitors" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
	},

	// Mock options for mocking "Sessions" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		dimensions: [
			{
				name: 'date',
			},
		],
		limit: 10,
		metrics: [
			{
				name: 'averageSessionDuration',
			},
		],
	},

	// Mock options for mocking "Total Users" chart widget response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		compareStartDate: '2020-12-03',
		compareEndDate: '2020-12-30',
		metrics: [ { name: 'totalUsers' } ],
		dimensions: [ 'date' ],
		orderby: [
			{
				dimension: {
					dimensionName: 'date',
				},
			},
		],
	},

	// Mock options for mocking "Popular pages" report's response.
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		dimensions: [ 'pagePath' ],
		metrics: [
			{
				name: 'screenPageViews',
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
		limit: 5,
	},
];

const pageTitlesReportOptions = {
	startDate: '2020-12-31',
	endDate: '2021-01-27',
	dimensionFilters: {
		pagePath: new Array( 5 )
			.fill( '' )
			.map( ( _, i ) => `/test-post-${ i + 1 }/` )
			.sort(),
	},
	dimensions: [ 'pagePath', 'pageTitle' ],
	metrics: [ { name: 'screenPageViews' } ],
	orderby: [
		{
			metric: { metricName: 'screenPageViews' },
			desc: true,
		},
	],
	limit: 25,
};

export const provideAnalytics4ReportTitles = (
	registry,
	options = pageTitlesReportOptions
) => {
	const pageTitlesReport = getAnalytics4MockResponse(
		options,
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
};

export const setupAnalytics4MockReports = (
	registry,
	mockOptions = wpDashboardAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptions.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( getAnalytics4MockResponse( options ), {
				options,
			} );
	} );
};

export const setupSearchConsoleMockReports = ( registry, data ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	if ( data ) {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( data, {
			options: wpDashboardSearchConsoleOptions,
		} );
	} else {
		provideSearchConsoleMockReport(
			registry,
			wpDashboardSearchConsoleOptions
		);
	}
};

export const setupSearchConsoleGatheringData = ( registry ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
		options: wpDashboardSearchConsoleOptions,
	} );
};

export const setupAnalytics4GatheringData = ( registry ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
};

export function setupAnalytics4ZeroData(
	registry,
	mockOptionSets = wpDashboardAnalytics4OptionSets
) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptionSets.forEach( ( options ) => {
		const report = getAnalytics4MockResponse( options );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options,
		} );
	} );

	setupAnalytics4Property( registry );
}

export function setupAnalytics4Loading(
	registry,
	mockOptionSets = wpDashboardAnalytics4OptionSets
) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptionSets.forEach( ( options ) => {
		provideAnalytics4MockReport( registry, options );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ options ] );
	} );
}

export function setupAnalytics4Error(
	registry,
	mockOptionSets = wpDashboardAnalytics4OptionSets
) {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	const error = {
		code: 'missing_required_param',
		message: 'Request parameter is empty: metrics.',
		data: {},
	};

	mockOptionSets.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveError( error, 'getReport', [ options ] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );
	} );
}

export function setupAnalytics4Property( registry, createdDayBefore = 10 ) {
	const createTime = new Date(
		Date.now() - DAY_IN_SECONDS * createdDayBefore * 1000
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
}

export const setupSearchConsoleZeroData = ( registry ) => {
	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
		[
			{
				clicks: 0,
				ctr: 0,
				impressions: 0,
				keys: [ '2021-08-18' ],
				position: 0,
			},
		],
		{
			options: wpDashboardSearchConsoleOptions,
		}
	);
};

export const setupBaseRegistry = ( registry, args ) => {
	// Set up the search console and analytics modules stores but provide no data.
	provideModules( registry, [
		{
			slug: 'search-console',
			active: true,
			connected: true,
		},
		{
			slug: 'analytics-4',
			active: true,
			connected: true,
		},
	] );

	// Set some site information.
	provideSiteInfo( registry );

	// Call story-specific setup.
	if ( typeof args?.setupRegistry === 'function' ) {
		args.setupRegistry( registry );
	}
};

export const setupSearchConsoleAnalytics4GatheringData = ( registry ) => {
	setupSearchConsoleGatheringData( registry );
	setupAnalytics4GatheringData( registry );
};

export const setupSearchConsoleAnalytics4ZeroData = ( registry ) => {
	setupSearchConsoleZeroData( registry );
	setupAnalytics4ZeroData( registry );
};

export const widgetDecorators = [
	( Story ) => (
		<div id="dashboard-widgets">
			<div id="google_dashboard_widget" style={ { maxWidth: '600px' } }>
				<div className="inside">
					<div className="googlesitekit-wp-dashboard">
						<div className="googlesitekit-widget">
							<div className="googlesitekit-widget__body">
								<Story />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	),
	( Story, { args } ) => {
		const setupRegistry = ( registry ) => {
			setupBaseRegistry( registry, args );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
