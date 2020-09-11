/**
 * modules/analytics data store: report tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics report', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			const options = {
				dateRange: 'last-90-days',
				metrics: {
					expression: 'testExpression',
					alias: 'testAlias',
				},
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: fixtures.report, status: 200 }
				);

				const initialReport = registry.select( STORE_NAME ).getReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getReport( options );

				const report = registry.select( STORE_NAME ).getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetReport( fixtures.report, { options } );

				const report = registry.select( STORE_NAME ).getReport( options );

				await untilResolved( registry, STORE_NAME ).getReport( options );

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: response, status: 500 }
				);

				registry.select( STORE_NAME ).getReport( options );
				await untilResolved( registry, STORE_NAME ).getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry.select( STORE_NAME ).getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'sets adsenseLinked to false if a 400 error is returned for AdSense metrics due to them being restricted', async () => {
				const adsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:adsenseRevenue',
				};
				const restrictedMetricsError = {
					code: 400,
					message: 'Restricted metric(s): ga:adsenseRevenue can only be queried under certain conditions.',
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: restrictedMetricsError, status: 400 }
				);

				registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
				registry.dispatch( STORE_NAME ).setAdsenseLinked( true );
				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( true );

				registry.select( STORE_NAME ).getReport( adsenseOptions );
				await untilResolved( registry, STORE_NAME ).getReport( adsenseOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( false );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );

			it( 'does not modify adsenseLinked if a 400 error is returned for non-AdSense metrics', async () => {
				const nonAdsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:nonadsenseMetric',
				};
				const restrictedMetricsError = {
					code: 400,
					message: 'Restricted metric(s): ga:nonadsenseMetric can only be queried under certain conditions.',
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: restrictedMetricsError, status: 400 }
				);

				registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
				registry.dispatch( STORE_NAME ).setAdsenseLinked( true );
				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( true );

				registry.select( STORE_NAME ).getReport( nonAdsenseOptions );
				await untilResolved( registry, STORE_NAME ).getReport( nonAdsenseOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( true );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );

			it( 'sets adsenseLinked to true if a successful response is returned for AdSense metrics', async () => {
				const adsenseOptions = {
					dateRange: 'last-28-days',
					metrics: 'ga:adsenseRevenue',
				};
				const restrictedMetricsSuccess = [
					{
						totals: [],
						rows: [],
					},
				];
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: restrictedMetricsSuccess, status: 200 }
				);

				registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
				registry.dispatch( STORE_NAME ).setAdsenseLinked( false );
				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( false );

				registry.select( STORE_NAME ).getReport( adsenseOptions );
				await untilResolved( registry, STORE_NAME ).getReport( adsenseOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( true );
			} );

			it( 'sets adsenseLinked to true if a 400 error is returned for AdSense metrics due to non-AdSense restricted metrics', async () => {
				const adsenseAndNonAdSenseOptions = {
					dateRange: 'last-28-days',
					metrics: [ 'ga:nonadsenseMetric', 'ga:adsenseRevenue' ],
				};
				const restrictedMetricsError = {
					code: 400,
					message: 'Restricted metric(s): ga:nonadsenseMetric can only be queried under certain conditions.',
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/report/,
					{ body: restrictedMetricsError, status: 400 }
				);

				registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
				registry.dispatch( STORE_NAME ).setAdsenseLinked( false );
				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( false );

				registry.select( STORE_NAME ).getReport( adsenseAndNonAdSenseOptions );
				await untilResolved( registry, STORE_NAME ).getReport( adsenseAndNonAdSenseOptions );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( registry.select( STORE_NAME ).getAdsenseLinked() ).toBe( true );
				expect( console ).toHaveErrored(); // fetch will trigger 400 error.
			} );
		} );
	} );
} );
