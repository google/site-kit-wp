/**
 * Shared exports among Admin Bar GA4 Stories.
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
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideSearchConsoleMockReport } from '../../modules/search-console/util/data-mock';
import { replaceValuesInAnalytics4ReportWithZeroData } from '../../../../.storybook/utils/zeroReports';
import { getAnalytics4MockResponse } from '../../modules/analytics-4/utils/data-mock';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { DAY_IN_SECONDS } from '../../util';
import { properties } from '../../modules/analytics-4/datastore/__fixtures__';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';

const adminbarSearchConsoleOptions = {
	startDate: '2020-12-03',
	endDate: '2021-01-27',
	dimensions: 'date',
	url: 'https://www.sitekitbygoogle.com/blog/',
};

const adminbarAnalytics4OptionSets = [
	// Mock options for mocking isGatheringData selector's response.
	{
		dimensions: [
			{
				name: 'date',
			},
		],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		url: 'https://www.sitekitbygoogle.com/blog/',
	},

	// Mock options for mocking Total Users report's response.
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
		url: 'https://www.sitekitbygoogle.com/blog/',
	},
	{
		startDate: '2020-12-31',
		endDate: '2021-01-27',
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		dimensions: [ 'date' ],
		url: 'https://www.sitekitbygoogle.com/blog/',
	},

	// Mock options for mocking Sessions report's response.
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
				name: 'sessions',
			},
		],
		url: 'https://www.sitekitbygoogle.com/blog/',
	},
];

export const setupBaseRegistry = ( registry, args ) => {
	// Set some site information.
	provideSiteInfo( registry, {
		currentEntityURL: 'https://www.sitekitbygoogle.com/blog/',
		currentEntityTitle: 'Blog test post for Google Site Kit',
	} );

	// Provide authentication, if isAuthenticated is false `gatheringData` will not be updated for `analytics-4` module
	// leaving the `GA4` widgets in loading state.
	provideUserAuthentication( registry );

	// Set up analytics-4 modules stores but provide no data.
	provideModules( registry, [
		{
			slug: 'analytics-4',
			active: true,
			connected: true,
		},
	] );

	// Call story-specific setup.
	if ( typeof args?.setupRegistry === 'function' ) {
		args.setupRegistry( registry );
	}
};

export const widgetDecorators = [
	( Story ) => (
		<div className="googlesitekit-widget">
			<div className="googlesitekit-widget__body">
				<Story />
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

export const setupSearchConsoleMockReports = ( registry, data ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	if ( data ) {
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( data, {
			options: adminbarSearchConsoleOptions,
		} );
	} else {
		provideSearchConsoleMockReport(
			registry,
			adminbarSearchConsoleOptions
		);
	}
};

export const setupAnalytics4MockReports = (
	registry,
	mockOptions = adminbarAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1000' );
	mockOptions.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( getAnalytics4MockResponse( options ), {
				options,
			} );
	} );
};

export const setupSearchConsoleGatheringData = ( registry ) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
		options: adminbarSearchConsoleOptions,
	} );
};

export const setupAnalytics4GatheringData = (
	registry,
	mockOptionSets = adminbarAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

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
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetProperty( property, { propertyID } );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( propertyID );
	mockOptionSets.forEach( ( options ) => {
		const report = getAnalytics4MockResponse( options );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options,
		} );
	} );
};

export const setupSearchConsoleAnalytics4GatheringData = ( registry ) => {
	setupSearchConsoleGatheringData( registry );
	setupAnalytics4GatheringData( registry );
};

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
			options: adminbarSearchConsoleOptions,
		}
	);
};

export const setupAnalytics4ZeroData = (
	registry,
	mockOptionSets = adminbarAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1000' );

	mockOptionSets.forEach( ( options ) => {
		const report = getAnalytics4MockResponse( options );
		const zeroReport =
			replaceValuesInAnalytics4ReportWithZeroData( report );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport( zeroReport, {
			options,
		} );
	} );
};

export const setupSearchConsoleAnalytics4ZeroData = ( registry ) => {
	setupSearchConsoleZeroData( registry );
	setupAnalytics4ZeroData( registry );
};

export const setupAnalytics4Loading = (
	registry,
	mockOptionSets = adminbarAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

	mockOptionSets.forEach( ( options ) => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ options ] );
	} );
};

export const setupAnalytics4Error = (
	registry,
	mockOptionSets = adminbarAnalytics4OptionSets
) => {
	registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
	registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1000' );

	const error = {
		code: 'test_error',
		message: 'Error message.',
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
};
