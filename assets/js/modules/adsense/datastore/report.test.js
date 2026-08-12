/**
 * `modules/adsense` data store: report tests.
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
import { getAdSenseMockResponse } from '@/js/modules/adsense/util/data-mock';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { MODULES_ADSENSE } from './constants';

describe( 'modules/adsense report', () => {
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

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			const options = {
				startDate: '2021-07-01',
				endDate: '2021-07-28',
				metrics: [ 'IMPRESSIONS' ],
				dimensions: [ 'DATE' ],
			};

			it( 'uses a resolver to make a network request', async () => {
				const report = getAdSenseMockResponse( options );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: report }
				);

				expect(
					registry.select( MODULES_ADSENSE ).getReport( options )
				).toBeUndefined();
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.getReport( options ) !== undefined
				);

				expect(
					registry.select( MODULES_ADSENSE ).getReport( options )
				).toEqual( report );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				const report = getAdSenseMockResponse( options );

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetReport( report, { options } );

				const initialReport = registry
					.select( MODULES_ADSENSE )
					.getReport( options );
				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getReport', [ options ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( initialReport ).toEqual( report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: response, status: 500 }
				);

				registry.select( MODULES_ADSENSE ).getReport( options );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetReport( options ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ADSENSE )
					.getReport( options );
				expect( report ).toEqual( undefined );

				await untilResolved( registry, MODULES_ADSENSE ).getReport(
					options
				);
				expect( console ).toHaveErrored();
			} );

			it( 'forwards the abort signal from the fetch options to the report request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: getAdSenseMockResponse( options ) }
				);

				const { signal } = new AbortController();

				await registry
					.dispatch( MODULES_ADSENSE )
					.fetchGetReport( options, { signal } );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBe( signal );
			} );

			it( 'sends no abort signal to the report request when the call has no fetch options', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: getAdSenseMockResponse( options ) }
				);

				await registry
					.dispatch( MODULES_ADSENSE )
					.fetchGetReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock.lastOptions().signal ).toBeUndefined();
			} );

			it( 'forwards the abort signal from a getReport call to the report request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: getAdSenseMockResponse( options ) }
				);

				const { signal } = new AbortController();

				await registry
					.resolveSelect( MODULES_ADSENSE )
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
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: getAdSenseMockResponse( options ) }
				);

				await registry
					.resolveSelect( MODULES_ADSENSE )
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

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/report'
					),
					{ body: response, status: 500 }
				);

				const { signal } = new AbortController();

				await registry
					.resolveSelect( MODULES_ADSENSE )
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
						.select( MODULES_ADSENSE )
						.getErrorForSelector( 'getReport', [ options ] )
				).toEqual( response );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
