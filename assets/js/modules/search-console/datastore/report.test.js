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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	createWaitForRegistry,
	freezeFetch,
	muteFetch,
	provideSiteInfo,
	subscribeUntil,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import * as fixtures from './__fixtures__';
import { MODULES_SEARCH_CONSOLE } from './constants';

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
	let waitForRegistry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		waitForRegistry = createWaitForRegistry( registry );
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

			it( 'forwards the abort signal from the fetch options to the report request', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};
				const { signal } = new AbortController();

				await registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.fetchGetReport( options, { signal } );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBe( signal );
			} );

			it( 'sends no abort signal to the report request when the call has no fetch options', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};

				await registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.fetchGetReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBeUndefined();
			} );

			it( 'forwards the abort signal from a getReport call to the report request', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};
				const { signal } = new AbortController();

				await registry
					.resolveSelect( MODULES_SEARCH_CONSOLE )
					.getReport( options, { signal } );

				// The registry starts resolver runs from a timeout. Wait for
				// those timeouts to finish, so a second run with the same
				// options would send its request inside this test and make
				// the test fail.
				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBe( signal );
			} );

			it( 'sends one request and no abort signal when a getReport call has no fetch options', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
				};

				await registry
					.resolveSelect( MODULES_SEARCH_CONSOLE )
					.getReport( options );

				// The registry starts resolver runs from a timeout. Wait for
				// those timeouts to finish, so a second run with the same
				// options would send its request inside this test and make
				// the test fail.
				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBeUndefined();
			} );

			it( 'stores the error under the report options when a getReport call with an abort signal fails', async () => {
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
				const { signal } = new AbortController();

				await registry
					.resolveSelect( MODULES_SEARCH_CONSOLE )
					.getReport( options, { signal } );

				// The registry starts resolver runs from a timeout. Wait for
				// those timeouts to finish, so a second run with the same
				// options would send its request inside this test and make
				// the test fail.
				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// The store saves the error under the report options only,
				// so the same options that read the report also find the
				// error.
				expect(
					registry
						.select( MODULES_SEARCH_CONSOLE )
						.getErrorForSelector( 'getReport', [ options ] )
				).toEqual( response );
				expect( console ).toHaveErrored();
			} );

			it( 'sends one request when two getReport calls differ only in `reportID`', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const firstOptions = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_first-widget_component_reportArgs',
				};
				const secondOptions = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_second-widget_component_reportArgs',
				};

				registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( firstOptions );
				registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( secondOptions );

				// Wait for both resolvers together. `untilResolved` checks only
				// on the next registry update, so awaiting them one after the
				// other can hang if the second finishes during the first wait.
				const firstResolution = untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( firstOptions );
				const secondResolution = untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( secondOptions );

				await Promise.all( [ firstResolution, secondResolution ] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const firstReport = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( firstOptions );
				const secondReport = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( secondOptions );

				expect( firstReport ).toEqual( fixtures.report );
				// Both calls read the same saved report, so state stores the
				// report once.
				expect( firstReport ).toBe( secondReport );
			} );

			it( 'does not make a network request when the same report is already saved under another `reportID`', async () => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetReport( fixtures.report, {
						options: {
							startDate: '2020-01-01',
							endDate: '2020-04-05',
							reportID: 'test_first-widget_component_reportArgs',
						},
					} );

				const secondOptions = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_second-widget_component_reportArgs',
				};

				// An error for these options stays set when a matching report
				// is already cached. The resolver reads the shared report
				// without clearing the error.
				const error = { code: 'test_error', message: 'Test error' };
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.setErrorForSelector( error, 'getReport', [
						secondOptions,
					] );

				const report = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( secondOptions );

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( secondOptions );

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
				expect(
					registry
						.select( MODULES_SEARCH_CONSOLE )
						.getErrorForSelector( 'getReport', [ secondOptions ] )
				).toEqual( error );
			} );

			it( 'stores the error for every getReport call that shares one failed request', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				// Hold the response open so both calls join one running
				// request, instead of the first finishing before the second
				// resolver runs.
				const deferredResolvers = [];
				fetchMock.getOnce(
					searchAnalyticsRegexp,
					() =>
						new Promise( ( resolve ) => {
							deferredResolvers.push( () =>
								resolve( { body: response, status: 500 } )
							);
						} )
				);

				const firstOptions = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_first-widget_component_reportArgs',
				};
				const secondOptions = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_second-widget_component_reportArgs',
				};

				// Start the first call and wait until it sends the shared
				// request.
				registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( firstOptions );
				while ( deferredResolvers.length < 1 ) {
					await waitForDefaultTimeouts();
				}

				// The request is running now. Start the second call so it
				// joins that request instead of sending another.
				registry
					.select( MODULES_SEARCH_CONSOLE )
					.getReport( secondOptions );
				await waitForDefaultTimeouts();

				// Create both waiters before releasing the request, so each
				// subscribes while its resolver still runs. `untilResolved`
				// checks only on the next registry update, so a resolver that
				// finishes first would otherwise leave its waiter waiting until
				// the test times out.
				const firstResolution = untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( firstOptions );
				const secondResolution = untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( secondOptions );

				deferredResolvers.forEach( ( resolve ) => resolve() );

				await Promise.all( [ firstResolution, secondResolution ] );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_SEARCH_CONSOLE )
						.getErrorForSelector( 'getReport', [ firstOptions ] )
				).toEqual( response );
				expect(
					registry
						.select( MODULES_SEARCH_CONSOLE )
						.getErrorForSelector( 'getReport', [ secondOptions ] )
				).toEqual( response );
				expect( console ).toHaveErrored();
			} );

			it( 'does not send the `reportID` option with the report request', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, {
					body: fixtures.report,
				} );

				const options = {
					startDate: '2020-01-01',
					endDate: '2020-04-05',
					reportID: 'test_widget_component_reportArgs',
				};

				registry.select( MODULES_SEARCH_CONSOLE ).getReport( options );

				await untilResolved(
					registry,
					MODULES_SEARCH_CONSOLE
				).getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const [ reportRequestURL ] = fetchMock.lastCall();
				expect( reportRequestURL ).not.toContain( 'reportID' );
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
				await waitForRegistry();

				expect( fetchMock ).toHaveFetched( searchAnalyticsRegexp );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, errorResponse );

				const { isGatheringData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForRegistry();

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
				await waitForRegistry();

				expect( fetchMock ).toHaveFetched( searchAnalyticsRegexp );
			} );

			it( 'should return TRUE if report API returns error', async () => {
				fetchMock.getOnce( searchAnalyticsRegexp, errorResponse );

				const { hasZeroData } = registry.select(
					MODULES_SEARCH_CONSOLE
				);

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForRegistry();

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

				const dates = registry.select( CORE_USER ).getDateRangeDates( {
					compare: true,
				} );

				const args = registry
					.select( MODULES_SEARCH_CONSOLE )
					.getSampleReportArgs();

				// `getSampleReportArgs` uses `compareStartDate` as `startDate`.
				expect( args.startDate ).toBe( dates.compareStartDate );
				expect( args.endDate ).toBe( dates.endDate );
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
