/**
 * `modules/analytics-4` data store: benchmarking tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	freezeFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 benchmarking', () => {
	const benchmarkingDataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
	);

	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'getBenchmarkingData', () => {
		let dateNowSpy: jest.SpyInstance;

		beforeEach( () => {
			dateNowSpy = jest.spyOn( Date, 'now' );
		} );

		afterEach( () => {
			dateNowSpy.mockRestore();
		} );

		it( 'should return `undefined` while the request to the `benchmarking-data` route is in progress', async () => {
			freezeFetch( benchmarkingDataEndpoint );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBeUndefined();
		} );

		it( 'should return the decoded `visitors`, `dailyTraffic`, `dimensions`, and `contextualData` for a start date and an end date', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[ 'Organic Search' ],
					'2025-08-18',
					[ 132, 0, 147 ],
					[ 412, 388 ],
					{ 0: [ [ 0, 210, 168 ] ] },
					[ 0 ],
				],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetched( benchmarkingDataEndpoint, {
				query: { startDate: '2026-08-19', endDate: '2026-09-15' },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 412, previous: 388 },
				dailyTraffic: [
					{ date: '2025-08-18', visitors: 132 },
					{ date: '2025-08-19', visitors: 0 },
					{ date: '2025-08-20', visitors: 147 },
				],
				dimensions: [ 'CHANNELS' ],
				contextualData: {
					channels: [
						{
							label: 'Organic Search',
							current: 210,
							previous: 168,
						},
					],
				},
			} );
		} );

		it( 'should send one request and return the same object when the same start date and end date are selected three times before the response arrives', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			const firstResponse = registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			const secondResponse = registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			const thirdResponse = registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( firstResponse ).toEqual( {
				visitors: { current: 412, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
			expect( secondResponse ).toBe( firstResponse );
			expect( thirdResponse ).toBe( firstResponse );
		} );

		it( 'should not send another request when the same start date and end date are selected again after the response arrives', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		it( 'should not send a request when the next page loads 59 minutes after the response arrives', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T09:00:00Z' ) );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			// A new registry starts with an empty store, as a page load does, so the
			// benchmarking data can only come from the cache `googlesitekit-api`
			// keeps in session storage, or from a new request.
			const nextPageRegistry = createTestRegistry();

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T09:59:00Z' ) );
			nextPageRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				nextPageRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				nextPageRegistry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 412, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should send a new request when the next page loads 61 minutes after the response arrives', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 151 ], [ 431, 388 ], {}, [] ],
			} );

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T09:00:00Z' ) );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			const nextPageRegistry = createTestRegistry();

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T10:01:00Z' ) );
			nextPageRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				nextPageRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				nextPageRegistry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 431, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 151 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should send a request for each pair of dates and keep the response of each pair', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 1280, 1195 ], {}, [] ],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 397, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-06-18', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-06-18', '2026-09-15' );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-14' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-14' );

			expect( fetchMock ).toHaveFetchedTimes( 3 );
			expect( fetchMock ).toHaveFetched( benchmarkingDataEndpoint, {
				query: { startDate: '2026-06-18', endDate: '2026-09-15' },
			} );
			expect( fetchMock ).toHaveFetched( benchmarkingDataEndpoint, {
				query: { startDate: '2026-08-19', endDate: '2026-09-14' },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 412, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toEqual( {
				visitors: { current: 1280, previous: 1195 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-14' )
			).toEqual( {
				visitors: { current: 397, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should not send a request when the store already has the response for the start date and the end date', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visitors: { current: 412, previous: 388 },
					dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
					dimensions: [],
					contextualData: {},
				},
				{ startDate: '2026-08-19', endDate: '2026-09-15' }
			);

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should return `undefined` and store the error from the `benchmarking-data` route when the request fails', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: {
					code: 403,
					message:
						'User does not have sufficient permissions for this property.',
					data: { status: 403, reason: 'insufficientPermissions' },
				},
				status: 403,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getBenchmarkingData', [
						'2026-08-19',
						'2026-09-15',
					] )
			).toEqual( {
				code: 403,
				message:
					'User does not have sufficient permissions for this property.',
				data: { status: 403, reason: 'insufficientPermissions' },
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBeUndefined();
			expect( console ).toHaveErrored();
		} );

		it( 'should return `undefined` and store an error when the response has an unrecognized format version, such as `2`', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 2, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getBenchmarkingData', [
						'2026-08-19',
						'2026-09-15',
					] )
			).toEqual( {
				code: 'benchmarking_decode_failed',
				message: expect.stringContaining( 'Reload the page' ),
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBeUndefined();
		} );

		it( 'should not send a request when the start date is missing', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( undefined, '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not send a request when the end date is missing', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', undefined );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not send a request when a date is not written as `YYYY-MM-DD`, such as `2026-8-19`', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-8-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not send a request when the start date is `2026-13-45`, which is not a real date', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-13-45', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not send a request when the end date is `2026-13-45`, which is not a real date', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-13-45' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );
	} );

	describe( 'isLoadingBenchmarkingData', () => {
		it( 'should return `false` before the start date and the end date are selected', () => {
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBe( false );
		} );

		it( 'should return `true` while the request is in progress', async () => {
			freezeFetch( benchmarkingDataEndpoint );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBe( true );
		} );

		it( 'should return `false` after the response arrives', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBe( false );
		} );

		it( 'should return `false` after the request fails', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: {
					code: 403,
					message:
						'User does not have sufficient permissions for this property.',
					data: { status: 403, reason: 'insufficientPermissions' },
				},
				status: 403,
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBe( false );
			expect( console ).toHaveErrored();
		} );

		it( 'should stay `false` when the start date and the end date are selected and the store already has their response', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visitors: { current: 412, previous: 388 },
					dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
					dimensions: [],
					contextualData: {},
				},
				{ startDate: '2026-08-19', endDate: '2026-09-15' }
			);

			const loadingValues: boolean[] = [];
			registry.subscribe( () => {
				loadingValues.push(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingBenchmarkingData( '2026-08-19', '2026-09-15' )
				);
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			// `@wordpress/data` updates the store when the resolver starts and when
			// it finishes, and the resolver sends no request in between.
			expect( loadingValues ).toEqual( [ false, false ] );
		} );
	} );

	describe( 'clearBenchmarkingData', () => {
		it( 'should delete the response for the start date and the end date from the store', async () => {
			freezeFetch( benchmarkingDataEndpoint );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visitors: { current: 412, previous: 388 },
					dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
					dimensions: [],
					contextualData: {},
				},
				{ startDate: '2026-08-19', endDate: '2026-09-15' }
			);
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 412, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBeUndefined();
		} );

		it( 'should delete the response for the start date and the end date from the API cache', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			// `googlesitekit-api` keeps each cached response as one entry in session storage.
			expect( sessionStorage ).toHaveLength( 1 );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( sessionStorage ).toHaveLength( 0 );
		} );

		it( 'should send a new request to the `benchmarking-data` route when the start date and the end date are selected again', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 151 ], [ 431, 388 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visitors: { current: 431, previous: 388 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 151 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should keep the response for another pair of dates in the store', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visitors: { current: 412, previous: 388 },
					dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
					dimensions: [],
					contextualData: {},
				},
				{ startDate: '2026-08-19', endDate: '2026-09-15' }
			);
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visitors: { current: 1280, previous: 1195 },
					dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
					dimensions: [],
					contextualData: {},
				},
				{ startDate: '2026-06-18', endDate: '2026-09-15' }
			);

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toEqual( {
				visitors: { current: 1280, previous: 1195 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should keep the response for another pair of dates in the API cache', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 412, 388 ], {}, [] ],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [ 1, [], '2025-08-18', [ 132 ], [ 1280, 1195 ], {}, [] ],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-06-18', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-06-18', '2026-09-15' );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			// A new registry starts with an empty store, so only the cache
			// `googlesitekit-api` keeps in session storage can return the response
			// for the other pair of dates.
			const nextPageRegistry = createTestRegistry();

			nextPageRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-06-18', '2026-09-15' );
			await untilResolved(
				nextPageRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-06-18', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				nextPageRegistry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toEqual( {
				visitors: { current: 1280, previous: 1195 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 132 } ],
				dimensions: [],
				contextualData: {},
			} );
		} );

		it( 'should throw an error when a date is not written as `YYYY-MM-DD`, such as `2026-8-19`', () => {
			expect( () =>
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearBenchmarkingData( '2026-8-19', '2026-09-15' )
			).toThrow( 'Valid startDate and endDate values are required' );
		} );
	} );
} );
