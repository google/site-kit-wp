/**
 * `modules/analytics-4` data store: report tests.
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
import API from 'googlesitekit-api';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	untilResolved,
	unsubscribeFromAll,
	freezeFetch,
	waitForDefaultTimeouts,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import { isZeroReport } from '../util';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 report', () => {
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
		const zeroRowsReport = { rows: [] };

		describe( 'getReport', () => {
			const options = {
				startDate: '2022-11-02',
				endDate: '2022-11-04',
				compareStartDate: '2022-11-01',
				compareEndDate: '2022-11-02',
				dimensions: [
					// Provide dimensions in both string and array formats.
					'sessionDefaultChannelGrouping',
					{
						name: 'pageTitle',
					},
				],
				metrics: [
					'sessions',
					{
						name: 'PageViews',
					},
					{
						name: 'total',
						expression: 'totalUsers',
					},
				],
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/report/,
					{
						body: fixtures.report,
						status: 200,
					}
				);

				const initialReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( initialReport ).toEqual( undefined );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( fixtures.report, { options } );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );

				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
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

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics-4\/data\/report/,
					{
						body: response,
						status: 500,
					}
				);

				registry.select( MODULES_ANALYTICS_4 ).getReport( options );
				await untilResolved( registry, MODULES_ANALYTICS_4 ).getReport(
					options
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isGatheringData', () => {
			it( 'should return undefined if getReport is not resolved yet', async () => {
				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					)
				);

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForDefaultTimeouts();
			} );

			it( 'should return TRUE if the returned report is null', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{
						body: { rows: null },
					}
				);

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			it( 'should return TRUE if the returned report is an empty array', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{
						body: zeroRowsReport,
					}
				);

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( true );
			} );

			it( 'should return FALSE if the returned report has rows', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{
						body: fixtures.report,
					}
				);

				const { isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( isGatheringData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
			} );
		} );

		describe( 'hasZeroData', () => {
			it( 'should return undefined if getReport or isGatheringData is not resolved yet', async () => {
				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					)
				);

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				// Wait for resolvers to run.
				await waitForDefaultTimeouts();
			} );

			it( 'should return TRUE if isGatheringData is true', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					// When `rows` is `null` it means we're still gathering data for
					// this report.
					{ body: { rows: null } }
				);

				const { hasZeroData, isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return TRUE if isZeroReport is true', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{ body: zeroRowsReport }
				);

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( true );
			} );

			it( 'should return FALSE if isGatheringData returns FALSE', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{
						body: fixtures.report,
					}
				);

				const { hasZeroData, isGatheringData } =
					registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => isGatheringData() !== undefined,
					() => hasZeroData() !== undefined
				);

				expect( isGatheringData() ).toBe( false );
				expect( hasZeroData() ).toBe( false );
			} );

			it( 'should return FALSE if isZeroReport returns FALSE', async () => {
				expect( isZeroReport( fixtures.report ) ).toBe( false );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/report'
					),
					{
						body: fixtures.report,
					}
				);

				const { hasZeroData } = registry.select( MODULES_ANALYTICS_4 );

				expect( hasZeroData() ).toBeUndefined();

				await subscribeUntil(
					registry,
					() => hasZeroData() !== undefined
				);

				expect( hasZeroData() ).toBe( false );
			} );
		} );
	} );
} );
