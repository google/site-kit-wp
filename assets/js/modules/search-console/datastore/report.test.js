/**
 * `modules/search-console` data store: report tests.
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
import { setUsingCache } from 'googlesitekit-api';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from './constants';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideSiteInfo,
	subscribeUntil,
	untilResolved,
	waitForTimeouts,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/search-console report', () => {
	const searchAnalyticsRegexp = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
	);
	const dataAvailableRegexp = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/data-available'
	);
	const errorResponse = {
		status: 403,
		body: {
			code: 403,
			message:
				'User does not have sufficient permissions for this profile.',
			data: { status: 403, reason: 'forbidden' },
		},
	};
	const consoleError = [
		'Google Site Kit API Error',
		'method:GET',
		'datapoint:searchanalytics',
		'type:modules',
		'identifier:search-console',
		'error:"User does not have sufficient permissions for this profile."',
	];

	let registry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};

				const initialReport = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( options );

				expect( initialReport ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_SEARCH_CONSOLE )
							.getReport( options ) !== undefined
				);

				const report = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetReport( fixtures.report, { options } );

				const report = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( options );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_SEARCH_CONSOLE )
						.hasFinishedResolution( 'getReport', [ options ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: response,
					status: 500,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};

				registry.select( MODULES_SEARCH_CONSOLE ).getReport( options );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_SEARCH_CONSOLE )
							.isFetchingGetReport( options ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( options );
				expect( report ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( options );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isGatheringData', () => {
			it( 'should return `undefined` if getReport is not resolved yet', async () => {
				freezeFetch( searchAnalyticsRegexp );

				const { isGatheringData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( fetchMock ).toHaveFetched( searchAnalyticsRegexp );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, errorResponse );

				const { isGatheringData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( console ).toHaveErroredWith( ...consoleError );
				expect( isGatheringData() ).toBe( true );
				expect( fetchMock ).not.toHaveFetched( dataAvailableRegexp );
			} );

			it( 'should return TRUE if the returned report is an empty array', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, { body: [] } );

				const { isGatheringData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			it( 'should return FALSE if the returned report has rows', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { isGatheringData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
			} );
		} );

		describe( 'hasZeroData', () => {
			it( 'should return `undefined` if getReport or isGatheringData is not resolved yet', async () => {
				freezeFetch( searchAnalyticsRegexp );

				const { hasZeroData, isResolving } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isResolving( 'isGatheringData', [] ) === true
				);

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( fetchMock ).toHaveFetched( searchAnalyticsRegexp );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, errorResponse );

				const { hasZeroData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForTimeouts( 30 );

				expect( console ).toHaveErroredWith( ...consoleError );

				expect( hasZeroData() ).toBe( true );
				expect( fetchMock ).not.toHaveFetched( dataAvailableRegexp );
			} );

			it( 'should return TRUE if report data in isGatheringData OR isZeroReport is an empty array', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, { body: [] } );

				const { hasZeroData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return FALSE if isGatheringData and isZeroReport return false', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				muteFetch( dataAvailableRegexp );

				const { hasZeroData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( false );
			} );
		} );

		describe( 'getSampleReportArgs', () => {
			it( 'should return report arguments relative to the current reference date', () => {
				registry.dispatch( CORE_USER ).setReferenceDate( '2024-05-01' );

				const args = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getSampleReportArgs();

				expect( args.startDate ).toBe( '2024-03-06' );
				expect( args.endDate ).toBe( '2024-04-30' );
				expect( args.dimensions ).toBe( 'date' );
				expect( args.url ).toBeUndefined();
			} );

			it( 'should include the URL property from the current entity URL', () => {
				const entityURL = 'http://example.com';
				provideSiteInfo( registry, { currentEntityURL: entityURL } );

				const args = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getSampleReportArgs();

				expect( args.url ).toBe( entityURL );
			} );
		} );
	} );
} );
