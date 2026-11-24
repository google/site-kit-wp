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
import { setUsingCache } from 'googlesitekit-api';
import { createCacheKey } from '@/js/googlesitekit/api';
import {
	getItem,
	resetDefaultStorageOrder,
	setItem,
	setStorageOrder,
} from '@/js/googlesitekit/api/cache';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { BenchmarkingInsight } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import {
	createTestRegistry,
	freezeFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import {
	availabilityWithoutTraffic,
	benchmarkingInsight,
	decodedBenchmarkingResponse,
	provideBenchmarkingData,
	provideBenchmarkingInsight,
} from './__factories__/benchmarking';
import { getBenchmarkingDataCacheTTL } from './benchmarking';
import { MODULES_ANALYTICS_4 } from './constants';
import {
	AI_INSIGHT_DEADLINE,
	AI_INSIGHT_OPERATION_LIFETIME,
	AI_INSIGHT_POLL_INTERVAL,
	AI_INSIGHT_RATE_LIMIT_HOLD,
	AI_INSIGHT_RETRY_INTERVAL,
} from './utils/ai-insight';

/**
 * Reads an item that every tab of the login session shares, as the store keeps
 * the benchmarking response and the insight.
 *
 * @since n.e.x.t
 *
 * @param {string} key The key of the item.
 * @return {Promise<Object>} The read, with `cacheHit` and `value`.
 */
function getSharedItem( key: string ) {
	return getItem( key, { shared: true } );
}

/**
 * Writes an item that every tab of the login session shares.
 *
 * @since n.e.x.t
 *
 * @param {string} key         The key of the item.
 * @param {*}      value       The value.
 * @param {Object} options     The options of the item.
 * @param {number} options.ttl The time to keep the item, in seconds.
 * @return {Promise<boolean>} Whether the item was written.
 */
function setSharedItem(
	key: string,
	value: unknown,
	{ ttl }: { ttl: number }
) {
	return setItem( key, value, { ttl, shared: true } );
}

describe( 'modules/analytics-4 benchmarking', () => {
	const benchmarkingDataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
	);

	let registry: WPDataRegistry;

	beforeAll( () => {
		// The cache keeps the items of one tab in `sessionStorage`, and the
		// items every tab shares in `localStorage`, as in a browser.
		setStorageOrder( [ 'sessionStorage', 'localStorage' ] );
	} );

	afterAll( () => {
		resetDefaultStorageOrder();
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'getBenchmarkingData', () => {
		let dateNowSpy: jest.SpyInstance;

		beforeEach( () => {
			dateNowSpy = jest.spyOn( Date, 'now' );
			// The day after the date ranges of the tests, whose figures GA4
			// still updates.
			registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-16' );
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

		it( 'should return the decoded `visits`, `dailyTraffic`, `availability`, and `keyFactors` for a start date and an end date', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[ 'Organic Search' ],
					'2025-08-18',
					[ 132, 0, 147 ],
					[ 412, 388 ],
					[ [ 0, 0, 210, 222, 40.3 ] ],
					[ [] ],
					[ null, [ 118.4, 183.1 ], [ 124.3, 191.5 ] ],
					[ false, false, 4, true, -19, true, false, false, false ],
					[],
					false,
					null,
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
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
					{
						date: '2025-08-19',
						visits: 0,
						expectedMin: 118.4,
						expectedMax: 183.1,
					},
					{
						date: '2025-08-20',
						visits: 147,
						expectedMin: 124.3,
						expectedMax: 191.5,
					},
				],
				availability: {
					rangeTooShort: false,
					bandAvailable: false,
					bandAvailableFrom: '2025-08-22',
					keyFactorsAvailable: true,
					keyFactorsAvailableFrom: '2025-07-30',
					insightRequestAllowed: true,
					performanceInsightAvailable: false,
					lastYearAvailable: false,
					rangeTooLong: false,
				},
				bandReferenceDays: null,
				keyFactors: [
					{
						kind: 'CHANNEL',
						label: 'Organic Search',
						current: 210,
						previous: 222,
						sharePct: 40.3,
						attributes: [],
					},
				],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should send one request and return the same object when the same start date and end date are selected three times before the request finishes', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
			expect( secondResponse ).toBe( firstResponse );
			expect( thirdResponse ).toBe( firstResponse );
		} );

		it( 'should not send another request when the same start date and end date are selected again after the first request finishes', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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

		it( 'should not send a request when the next page loads 59 minutes after the first request succeeds', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should send a new request when the next page loads 61 minutes after the first request succeeds', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 151 ],
					[ 431, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
				visits: { current: 431, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 151,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should not send a request when another tab loads the page while the response is valid', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T09:00:00Z' ) );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			// Another tab starts with an empty `sessionStorage`.
			sessionStorage.clear();
			const otherTabRegistry = createTestRegistry();

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-16T09:30:00Z' ) );
			otherTabRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				otherTabRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				otherTabRegistry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toMatchObject( { visits: { current: 412, previous: 388 } } );
		} );

		it( 'should keep the response for a day when its date range ends before the last three days', async () => {
			const response = {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			};
			fetchMock.get( benchmarkingDataEndpoint, response );

			// 2026-09-16, 2026-09-17 and 2026-09-18 are the last three days.
			registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-18' );
			dateNowSpy.mockReturnValue( Date.parse( '2026-09-18T09:00:00Z' ) );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			const laterRegistry = createTestRegistry();

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-19T08:59:00Z' ) );
			laterRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				laterRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 1 );

			const nextDayRegistry = createTestRegistry();

			dateNowSpy.mockReturnValue( Date.parse( '2026-09-19T09:01:00Z' ) );
			nextDayRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				nextDayRegistry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		it( 'should send a request for each pair of dates and keep the response of each pair', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 1280, 1195 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 397, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
				query: { startDate: '2026-08-19', endDate: '2026-09-15' },
			} );
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
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toEqual( {
				visits: { current: 1280, previous: 1195 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-14' )
			).toEqual( {
				visits: { current: 397, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should not send a request when the store already has the response for the start date and the end date', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visits: { current: 412, previous: 388 },
					dailyTraffic: [
						{
							date: '2025-08-18',
							visits: 132,
							expectedMin: null,
							expectedMax: null,
						},
					],
					availability: availabilityWithoutTraffic,
					bandReferenceDays: null,
					keyFactors: [],
					steadyTraffic: false,
					contentMarkers: [],
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
				body: [
					2,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					null,
				],
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

		it( 'should return `undefined` and store an error when the response has fewer expected ranges than daily counts', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132, 147 ],
					[ 412, 388 ],
					[],
					[],
					[ [ 118.4, 183.1 ] ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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

		it( 'should send a new request when the next page loads after the first response has an unrecognized format version, such as `2`', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					2,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await untilResolved(
				registry,
				MODULES_ANALYTICS_4
			).getBenchmarkingData( '2026-08-19', '2026-09-15' );

			const nextPageRegistry = createTestRegistry();

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
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
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

		it( 'should not send a request when the start date is not written as `YYYY-MM-DD`, such as `2026-8-19`', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-8-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not send a request when the end date is not written as `YYYY-MM-DD`, such as `2026-9-15`', async () => {
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-9-15' );
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

	describe( 'getBenchmarkingDataCacheTTL', () => {
		it.each( [
			[ 'ends today', '2026-09-15', HOUR_IN_SECONDS ],
			[ 'ends two days ago', '2026-09-13', HOUR_IN_SECONDS ],
			[ 'ends three days ago', '2026-09-12', DAY_IN_SECONDS ],
			[ 'ended a month ago', '2026-08-15', DAY_IN_SECONDS ],
		] )(
			'should keep the response of a date range that %s for %d seconds',
			( _, endDate, ttl ) => {
				expect(
					getBenchmarkingDataCacheTTL( endDate, '2026-09-15' )
				).toBe( ttl );
			}
		);
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

		it( 'should return `false` for a pair of dates while the request for another pair is in progress', async () => {
			freezeFetch( benchmarkingDataEndpoint );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' );
			await waitForDefaultTimeouts();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toBe( false );
		} );

		it( 'should return `false` after the request succeeds', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
					visits: { current: 412, previous: 388 },
					dailyTraffic: [
						{
							date: '2025-08-18',
							visits: 132,
							expectedMin: null,
							expectedMax: null,
						},
					],
					availability: availabilityWithoutTraffic,
					bandReferenceDays: null,
					keyFactors: [],
					steadyTraffic: false,
					contentMarkers: [],
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

			expect( loadingValues ).toEqual( [ false, false ] );
		} );
	} );

	describe( 'clearBenchmarkingData', () => {
		it( 'should delete the response for the start date and the end date from the store and keep the response for another pair of dates', async () => {
			freezeFetch( benchmarkingDataEndpoint );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visits: { current: 412, previous: 388 },
					dailyTraffic: [
						{
							date: '2025-08-18',
							visits: 132,
							expectedMin: null,
							expectedMax: null,
						},
					],
					availability: availabilityWithoutTraffic,
					bandReferenceDays: null,
					keyFactors: [],
					steadyTraffic: false,
					contentMarkers: [],
				},
				{ startDate: '2026-08-19', endDate: '2026-09-15' }
			);
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetBenchmarkingData(
				{
					visits: { current: 1280, previous: 1195 },
					dailyTraffic: [
						{
							date: '2025-08-18',
							visits: 132,
							expectedMin: null,
							expectedMax: null,
						},
					],
					availability: availabilityWithoutTraffic,
					bandReferenceDays: null,
					keyFactors: [],
					steadyTraffic: false,
					contentMarkers: [],
				},
				{ startDate: '2026-06-18', endDate: '2026-09-15' }
			);

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toEqual( {
				visits: { current: 412, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-08-19', '2026-09-15' )
			).toBeUndefined();
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingData( '2026-06-18', '2026-09-15' )
			).toEqual( {
				visits: { current: 1280, previous: 1195 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should delete the response for the start date and the end date from the API cache and keep the response for another pair of dates', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 1280, 1195 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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

			expect( localStorage ).toHaveLength( 2 );

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( '2026-08-19', '2026-09-15' );

			expect( localStorage ).toHaveLength( 1 );

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
				visits: { current: 1280, previous: 1195 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 132,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
			} );
		} );

		it( 'should send a new request to the `benchmarking-data` route when the start date and the end date are selected again', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 132 ],
					[ 412, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
			} );
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: [
					1,
					[],
					'2025-08-18',
					[ 151 ],
					[ 431, 388 ],
					[],
					[],
					[ null ],
					[
						false,
						false,
						null,
						false,
						null,
						false,
						false,
						false,
						false,
					],
					[],
					false,
					null,
				],
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
				visits: { current: 431, previous: 388 },
				dailyTraffic: [
					{
						date: '2025-08-18',
						visits: 151,
						expectedMin: null,
						expectedMax: null,
					},
				],
				availability: availabilityWithoutTraffic,
				bandReferenceDays: null,
				keyFactors: [],
				steadyTraffic: false,
				contentMarkers: [],
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

	describe( 'benchmarking insight', () => {
		const startDate = '2026-08-19';
		const endDate = '2026-09-15';
		const locale = 'en_US';
		const payload = 'eyJsb2NhbGUiOiJlbl9VUyJ9.c2lnbmF0dXJl';
		const otherPayload = 'eyJsb2NhbGUiOiJkZV9ERSJ9.c2lnbmF0dXJl';

		const insightEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-insight'
		);

		const runningOperation = { done: false, state: 'RUNNING' };
		const succeededOperation = {
			done: true,
			state: 'SUCCEEDED',
			insight: benchmarkingInsight,
		};

		beforeEach( () => {
			// The store waits between the requests for the insight.
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		/**
		 * Gets the key of the insight's cache entry.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} [entryPayload] Optional. The request the insight is written from. Default is the test's request.
		 * @return {string} The key.
		 */
		function getCacheKey( entryPayload = payload ) {
			return createCacheKey(
				'modules',
				'analytics-4',
				'benchmarking-generated-insight',
				{ payload: entryPayload }
			);
		}

		/**
		 * Stores a benchmarking response with the insight's request.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [targetRegistry] Optional. The registry to store it in. Default is the test's registry.
		 * @param {string} [insightPayload] Optional. The request the insight is written from. Default is the test's request.
		 * @return {void}
		 */
		function provideResponseWithPayload(
			targetRegistry = registry,
			insightPayload = payload
		) {
			provideBenchmarkingData(
				targetRegistry,
				{ startDate, endDate },
				{
					...decodedBenchmarkingResponse,
					insightLocale: locale,
					insightPayload,
				}
			);
		}

		/**
		 * Checks whether the resolution of the insight has finished.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} targetRegistry The registry to check.
		 * @return {boolean} Whether it has finished.
		 */
		function hasResolved( targetRegistry: WPDataRegistry ) {
			return targetRegistry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getBenchmarkingInsight', [
					startDate,
					endDate,
				] );
		}

		/**
		 * Runs the timers, 100 milliseconds at a time, until the resolution of the
		 * insight has finished.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} targetRegistry        The registry that resolves the insight.
		 * @param {number} remainingMilliseconds The longest time to run the timers for.
		 * @return {Promise} A promise that resolves once the resolution has finished.
		 */
		async function runTimersUntilResolved(
			targetRegistry: WPDataRegistry,
			remainingMilliseconds: number
		): Promise< void > {
			if ( hasResolved( targetRegistry ) ) {
				return;
			}

			if ( remainingMilliseconds < 0 ) {
				throw new Error( 'getBenchmarkingInsight() did not resolve.' );
			}

			await jest.advanceTimersByTimeAsync( 100 );
			await runTimersUntilResolved(
				targetRegistry,
				remainingMilliseconds - 100
			);
		}

		/**
		 * Selects the insight, and runs the timers until its resolution has
		 * finished.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [targetRegistry] Optional. The registry that resolves the insight. Default is the test's registry.
		 * @return {Promise<(Object|null)>} The insight, or null.
		 */
		async function resolveInsight(
			targetRegistry = registry
		): Promise< BenchmarkingInsight | null | undefined > {
			targetRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingInsight( startDate, endDate );

			await jest.advanceTimersByTimeAsync( 0 );
			await runTimersUntilResolved(
				targetRegistry,
				AI_INSIGHT_DEADLINE + AI_INSIGHT_POLL_INTERVAL
			);

			return targetRegistry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingInsight( startDate, endDate );
		}

		/**
		 * Gets the error the resolution of the insight stopped with.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [targetRegistry] Optional. The registry that resolved the insight. Default is the test's registry.
		 * @return {(Object|undefined)} The error, if there is one.
		 */
		function getInsightError( targetRegistry = registry ) {
			return targetRegistry
				.select( MODULES_ANALYTICS_4 )
				.getErrorForSelector( 'getBenchmarkingInsight', [
					startDate,
					endDate,
				] );
		}

		/**
		 * Builds the error response of a failed request.
		 *
		 * @since n.e.x.t
		 *
		 * @param {number} status The status of the response.
		 * @param {Object} [data] Optional. More data of the error, such as `reason` and `retryAfter`.
		 * @param {string} [code] Optional. The code of the error. Default is `benchmarking_insight_error`.
		 * @return {Object} The response, with its `body` and `status`.
		 */
		function errorResponse(
			status: number,
			data: Record< string, unknown > = {},
			code = 'benchmarking_insight_error'
		) {
			return {
				body: {
					code,
					message: 'The service refused the request.',
					data: { status, ...data },
				},
				status,
			};
		}

		describe( 'getBenchmarkingInsight', () => {
			it( 'should return `undefined` while the insight loads', () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, new Promise( () => {} ) );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toBeUndefined();
			} );

			it( 'should return null and send no request when the benchmarking response has no request for the insight', async () => {
				provideBenchmarkingData( registry, { startDate, endDate } );

				expect( await resolveInsight() ).toBeNull();
				expect( fetchMock ).not.toHaveFetched();
				expect( getInsightError() ).toBeUndefined();
			} );

			it( 'should return null and send no request for the insight when the request for the benchmarking response fails', async () => {
				fetchMock.getOnce(
					benchmarkingDataEndpoint,
					errorResponse( 500 )
				);

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).not.toHaveFetched( insightEndpoint );
				// The failure is the error of the benchmarking response alone.
				expect( getInsightError() ).toBeUndefined();
			} );

			it( 'should ask for the insight with the request that the benchmarking response for the same dates carries', async () => {
				fetchMock.getOnce( benchmarkingDataEndpoint, {
					body: [ ...benchmarkingData, locale, payload ],
				} );
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( fetchMock ).toHaveFetched( benchmarkingDataEndpoint, {
					query: { startDate, endDate },
				} );
				// The payload travels back unread.
				expect( fetchMock ).toHaveFetched( insightEndpoint, {
					method: 'POST',
					body: { data: { payload } },
				} );
			} );

			it( 'should return the insight the service already had, with one request', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should read the operation that generates the insight every two seconds until it is done, and return its insight', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: runningOperation,
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: succeededOperation,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingInsight( startDate, endDate );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'POST',
				} );
				expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
					method: 'GET',
				} );

				await jest.advanceTimersByTimeAsync(
					AI_INSIGHT_POLL_INTERVAL - 1
				);

				expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
					method: 'GET',
				} );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'GET',
					query: { operationID: 'operation-1' },
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toBeUndefined();

				await jest.advanceTimersByTimeAsync( AI_INSIGHT_POLL_INTERVAL );

				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
					method: 'GET',
					query: { operationID: 'operation-1' },
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toEqual( benchmarkingInsight );
				// The insight replaces the operation in the cache entry.
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { insight: benchmarkingInsight },
				} );
			} );

			it( 'should keep the operation in the cache entry while it runs', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.get( insightEndpoint, new Promise( () => {} ) );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingInsight( startDate, endDate );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( await getSharedItem( getCacheKey() ) ).toEqual( {
					cacheHit: true,
					value: {
						operationID: 'operation-1',
						createdAt: Date.now(),
					},
					isError: false,
				} );
			} );

			it.each( [
				[ 409, 'GENERATION_IN_PROGRESS' ],
				[ 503, 'SERVICE_BUSY' ],
			] )(
				'should ask again after the `retryAfter` of a %d',
				async ( status, reason ) => {
					provideResponseWithPayload();
					fetchMock.postOnce(
						insightEndpoint,
						errorResponse( status, { reason, retryAfter: 1 } )
					);
					fetchMock.postOnce( insightEndpoint, {
						body: { insight: benchmarkingInsight },
					} );

					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate );

					await jest.advanceTimersByTimeAsync( 999 );

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						insightEndpoint
					);

					await jest.advanceTimersByTimeAsync( 1 );

					expect( console ).toHaveErrored();
					expect( fetchMock ).toHaveFetchedTimes(
						2,
						insightEndpoint
					);
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getBenchmarkingInsight( startDate, endDate )
					).toEqual( benchmarkingInsight );
					expect( getInsightError() ).toBeUndefined();
					// The store reports the outcome alone.
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getErrorForSelector( 'submitBenchmarkingInsight', [
								payload,
							] )
					).toBeUndefined();
				}
			);

			it.each( [
				[ 409, 'GENERATION_IN_PROGRESS' ],
				[ 503, 'SERVICE_BUSY' ],
			] )(
				'should ask again after five seconds when a %d has no `retryAfter`',
				async ( status, reason ) => {
					provideResponseWithPayload();
					fetchMock.postOnce(
						insightEndpoint,
						errorResponse( status, { reason } )
					);
					fetchMock.postOnce( insightEndpoint, {
						body: { insight: benchmarkingInsight },
					} );

					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate );

					await jest.advanceTimersByTimeAsync(
						AI_INSIGHT_RETRY_INTERVAL - 1
					);

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						insightEndpoint
					);

					await jest.advanceTimersByTimeAsync( 1 );

					expect( console ).toHaveErrored();
					expect( fetchMock ).toHaveFetchedTimes(
						2,
						insightEndpoint
					);
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.getBenchmarkingInsight( startDate, endDate )
					).toEqual( benchmarkingInsight );
				}
			);

			it( 'should not ask again when the `retryAfter` of a refusal ends after the deadline', async () => {
				const refusal = errorResponse( 503, {
					reason: 'SERVICE_BUSY',
					retryAfter: AI_INSIGHT_DEADLINE / 1000,
				} );

				provideResponseWithPayload();
				fetchMock.post( insightEndpoint, refusal );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );
				expect( getInsightError() ).toEqual( refusal.body );
			} );

			it( 'should read the operation after the `retryAfter` of the submit, and then after the `retryAfter` of each read', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1', retryAfter: 3 },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: { ...runningOperation, retryAfter: 1 },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: succeededOperation,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingInsight( startDate, endDate );

				await jest.advanceTimersByTimeAsync( 0 );
				await jest.advanceTimersByTimeAsync( 2999 );

				expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
					method: 'GET',
				} );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'GET',
				} );

				await jest.advanceTimersByTimeAsync( 999 );

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'GET',
				} );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
					method: 'GET',
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toEqual( benchmarkingInsight );
			} );

			it.each( [
				[ 'a second for a `retryAfter` of 0', 0, 1000 ],
				[
					'two seconds for a negative `retryAfter`',
					-1,
					AI_INSIGHT_POLL_INTERVAL,
				],
				[
					'two seconds for a `retryAfter` that is not a number',
					'1',
					AI_INSIGHT_POLL_INTERVAL,
				],
			] )(
				'should read the operation after %s',
				async ( _, retryAfter, expectedDelay ) => {
					provideResponseWithPayload();
					fetchMock.postOnce( insightEndpoint, {
						body: { operationID: 'operation-1', retryAfter },
					} );
					fetchMock.getOnce( insightEndpoint, {
						body: succeededOperation,
					} );

					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate );

					await jest.advanceTimersByTimeAsync( 0 );
					await jest.advanceTimersByTimeAsync( expectedDelay - 1 );

					expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
						method: 'GET',
					} );

					await jest.advanceTimersByTimeAsync( 1 );

					expect( fetchMock ).toHaveFetchedTimes(
						1,
						insightEndpoint,
						{
							method: 'GET',
						}
					);
				}
			);

			it( 'should give up, and keep the operation, when the `retryAfter` of a read ends after the deadline', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: {
						...runningOperation,
						retryAfter: AI_INSIGHT_DEADLINE / 1000,
					},
				} );

				expect( await resolveInsight() ).toBeNull();
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'GET',
				} );
				expect( getInsightError() ).toMatchObject( {
					code: 'benchmarking_insight_timeout',
				} );
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { operationID: 'operation-1' },
				} );
			} );

			it.each( [
				[
					'has expired',
					errorResponse( 404, { reason: 'NOT_FOUND' } ),
				],
				[
					'was interrupted',
					errorResponse(
						503,
						{ reason: 'SERVICE_BUSY' },
						'benchmarking_insight_failed'
					),
				],
			] )(
				'should ask for the insight again, once, when the operation %s',
				async ( _, lostOperationResponse ) => {
					provideResponseWithPayload();
					fetchMock.postOnce( insightEndpoint, {
						body: { operationID: 'operation-1' },
					} );
					fetchMock.getOnce( insightEndpoint, lostOperationResponse );
					fetchMock.postOnce( insightEndpoint, {
						body: { operationID: 'operation-2' },
					} );
					fetchMock.getOnce( insightEndpoint, {
						body: succeededOperation,
					} );

					expect( await resolveInsight() ).toEqual(
						benchmarkingInsight
					);
					expect( console ).toHaveErrored();
					expect( fetchMock ).toHaveFetchedTimes(
						2,
						insightEndpoint,
						{
							method: 'POST',
						}
					);
					expect( fetchMock ).toHaveFetched( insightEndpoint, {
						method: 'GET',
						query: { operationID: 'operation-2' },
					} );
				}
			);

			it( 'should give up when a second operation is lost too', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-2' },
				} );
				fetchMock.get(
					insightEndpoint,
					errorResponse( 404, { reason: 'NOT_FOUND' } )
				);

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
					method: 'POST',
				} );
				expect( getInsightError() ).toMatchObject( {
					data: { status: 404, reason: 'NOT_FOUND' },
				} );
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it( 'should ask for the insight again, once, when an operation from the cache entry still runs two minutes after it started', async () => {
				provideResponseWithPayload();
				await setSharedItem(
					getCacheKey(),
					{
						operationID: 'operation-1',
						createdAt: Date.now() - AI_INSIGHT_OPERATION_LIFETIME,
					},
					{ ttl: HOUR_IN_SECONDS }
				);
				fetchMock.getOnce( insightEndpoint, {
					body: runningOperation,
				} );
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'GET',
					query: { operationID: 'operation-1' },
				} );
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'POST',
				} );
			} );

			it( 'should read an operation from the cache entry at once, rather than ask for the insight again', async () => {
				provideResponseWithPayload();
				await setSharedItem(
					getCacheKey(),
					{
						operationID: 'operation-1',
						createdAt: Date.now() - 5000,
					},
					{ ttl: HOUR_IN_SECONDS }
				);
				fetchMock.getOnce( insightEndpoint, {
					body: succeededOperation,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingInsight( startDate, endDate );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched( insightEndpoint, {
					method: 'GET',
					query: { operationID: 'operation-1' },
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toEqual( benchmarkingInsight );
			} );

			it( 'should return null with the error, and keep it for an hour in place of the operation, when the generation fails', async () => {
				const failure = errorResponse(
					500,
					{ reason: 'MODEL_OUTPUT_INVALID' },
					'benchmarking_insight_failed'
				);

				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, failure );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( getInsightError() ).toEqual( failure.body );
				// The error of each request is moved to the outcome.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForSelector(
							'getBenchmarkingInsightOperation',
							[ 'operation-1' ]
						)
				).toBeUndefined();
				// The next load within the hour shows no insight either,
				// rather than costing another generation.
				expect( await getSharedItem( getCacheKey() ) ).toEqual( {
					cacheHit: true,
					value: { error: failure.body },
					isError: false,
				} );

				jest.setSystemTime( Date.now() + HOUR_IN_SECONDS * 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it( 'should give up at the deadline, and keep the operation for the next load', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.get( insightEndpoint, { body: runningOperation } );

				expect( await resolveInsight() ).toBeNull();
				// The store reads the operation every two seconds, and gives up
				// before a read that would end after the deadline.
				expect( fetchMock ).toHaveFetchedTimes(
					AI_INSIGHT_DEADLINE / AI_INSIGHT_POLL_INTERVAL - 1,
					insightEndpoint,
					{ method: 'GET' }
				);
				expect( getInsightError() ).toMatchObject( {
					code: 'benchmarking_insight_timeout',
				} );
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { operationID: 'operation-1' },
				} );
			} );

			it( 'should return null with an error when the service returns neither an insight nor an operation', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, { body: {} } );

				expect( await resolveInsight() ).toBeNull();
				expect( getInsightError() ).toMatchObject( {
					code: 'invalid_benchmarking_insight_response',
				} );
			} );

			it( 'should keep the insight for a day, so the next load reads it without a request', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				await resolveInsight();

				const nextRegistry = createTestRegistry();
				provideResponseWithPayload( nextRegistry );

				expect( await resolveInsight( nextRegistry ) ).toEqual(
					benchmarkingInsight
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				jest.setSystemTime( Date.now() + DAY_IN_SECONDS * 1000 - 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
				} );

				jest.setSystemTime( Date.now() + 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it( 'should ask for a new insight when the request changes, such as for new figures or another locale', async () => {
				await setSharedItem(
					getCacheKey( payload ),
					{ insight: benchmarkingInsight },
					{ ttl: DAY_IN_SECONDS }
				);
				provideResponseWithPayload( registry, otherPayload );
				fetchMock.postOnce( insightEndpoint, {
					body: {
						insight: {
							...benchmarkingInsight,
							analysis: 'Auf Deutsch.',
						},
					},
				} );

				expect( await resolveInsight() ).toMatchObject( {
					analysis: 'Auf Deutsch.',
				} );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it.each( [
				[
					'permissions, for an hour',
					403,
					'PERMISSION_DENIED',
					HOUR_IN_SECONDS,
				],
				[
					'an invalid request, for a day',
					400,
					'INVALID_ARGUMENT',
					DAY_IN_SECONDS,
				],
				[
					'a site the service has no record of, for a day',
					400,
					'SITE_NOT_FOUND',
					DAY_IN_SECONDS,
				],
				[
					'a failed model call, for an hour',
					500,
					'MODEL_UNAVAILABLE',
					HOUR_IN_SECONDS,
				],
				[
					'a model output that could not be used, for an hour',
					500,
					'MODEL_OUTPUT_INVALID',
					HOUR_IN_SECONDS,
				],
				[
					'another failure of the service, for an hour',
					500,
					'INTERNAL',
					HOUR_IN_SECONDS,
				],
				[
					'a 400 with a code the store does not know, by its status, for a day',
					400,
					'A_NEW_CODE',
					DAY_IN_SECONDS,
				],
				[
					'a 500 without a code, by its status, for an hour',
					500,
					undefined,
					HOUR_IN_SECONDS,
				],
			] )(
				'should keep a failure for %s, so the next load sends no request',
				async ( _, status, reason, lifetime ) => {
					const refusal = errorResponse( status, { reason } );

					provideResponseWithPayload();
					fetchMock.postOnce( insightEndpoint, refusal );

					expect( await resolveInsight() ).toBeNull();
					expect( console ).toHaveErrored();

					const nextRegistry = createTestRegistry();
					provideResponseWithPayload( nextRegistry );

					expect( await resolveInsight( nextRegistry ) ).toBeNull();
					expect( getInsightError( nextRegistry ) ).toEqual(
						refusal.body
					);
					expect( fetchMock ).toHaveFetchedTimes( 1 );

					jest.setSystemTime( Date.now() + lifetime * 1000 - 1000 );

					expect(
						await getSharedItem( getCacheKey() )
					).toMatchObject( {
						cacheHit: true,
					} );

					jest.setSystemTime( Date.now() + 1000 );

					expect(
						await getSharedItem( getCacheKey() )
					).toMatchObject( {
						cacheHit: false,
					} );
				}
			);

			it.each( [
				[
					'the rate limit, for 30 minutes though its Retry-After is a minute',
					'RATE_LIMITED',
					60,
					AI_INSIGHT_RATE_LIMIT_HOLD,
				],
				[
					'the rate limit, for longer when its Retry-After asks for it',
					'RATE_LIMITED',
					7200,
					2 * HOUR_IN_SECONDS,
				],
				[
					'the rate limit without a Retry-After, for 30 minutes',
					'RATE_LIMITED',
					undefined,
					AI_INSIGHT_RATE_LIMIT_HOLD,
				],
				[
					'a 429 with a code the store does not know, as the rate limit',
					'A_NEW_CODE',
					60,
					AI_INSIGHT_RATE_LIMIT_HOLD,
				],
				[
					'the daily cap, until its Retry-After',
					'DAILY_CAP',
					7200,
					2 * HOUR_IN_SECONDS,
				],
				[
					'the daily cap, until its Retry-After, though that is under 30 minutes',
					'DAILY_CAP',
					600,
					600,
				],
				[
					'the daily cap without a Retry-After, for an hour',
					'DAILY_CAP',
					undefined,
					HOUR_IN_SECONDS,
				],
				[
					'the daily cap, for up to a day',
					'DAILY_CAP',
					200000,
					DAY_IN_SECONDS,
				],
			] )(
				'should hold back the requests for every insight after a refusal for %s',
				async ( _, reason, retryAfter, lifetime ) => {
					const refusal = errorResponse( 429, {
						reason,
						retryAfter,
					} );

					provideResponseWithPayload();
					fetchMock.postOnce( insightEndpoint, refusal );

					expect( await resolveInsight() ).toBeNull();
					expect( console ).toHaveErrored();
					expect( getInsightError() ).toEqual( refusal.body );

					// The refusal isn't kept for its request alone.
					expect(
						await getSharedItem( getCacheKey() )
					).toMatchObject( {
						cacheHit: false,
					} );

					// The service's quota counts every request of the user and
					// of the site, so the insight of another request, such as
					// one for another date range, waits too.
					const nextRegistry = createTestRegistry();
					provideResponseWithPayload( nextRegistry, otherPayload );

					expect( await resolveInsight( nextRegistry ) ).toBeNull();
					expect( getInsightError( nextRegistry ) ).toEqual(
						refusal.body
					);
					expect( fetchMock ).toHaveFetchedTimes( 1 );

					// The API cache counts in whole seconds, so the checks
					// leave a second on each side of the lifetime.
					jest.setSystemTime( Date.now() + lifetime * 1000 - 2000 );

					const heldRegistry = createTestRegistry();
					provideResponseWithPayload( heldRegistry, otherPayload );

					expect( await resolveInsight( heldRegistry ) ).toBeNull();
					expect( fetchMock ).toHaveFetchedTimes( 1 );

					jest.setSystemTime( Date.now() + 3000 );
					fetchMock.postOnce( insightEndpoint, {
						body: { insight: benchmarkingInsight },
					} );

					const laterRegistry = createTestRegistry();
					provideResponseWithPayload( laterRegistry, otherPayload );

					expect( await resolveInsight( laterRegistry ) ).toEqual(
						benchmarkingInsight
					);
					expect( fetchMock ).toHaveFetchedTimes( 2 );
				}
			);

			it( 'should hold back the requests of every tab after a refusal for the quota', async () => {
				const refusal = errorResponse( 429, {
					reason: 'RATE_LIMITED',
					retryAfter: 60,
				} );

				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, refusal );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();

				// A new tab has a `sessionStorage` of its own, and shares
				// `localStorage`.
				sessionStorage.clear();

				const nextRegistry = createTestRegistry();
				provideResponseWithPayload( nextRegistry );

				expect( await resolveInsight( nextRegistry ) ).toBeNull();
				expect( getInsightError( nextRegistry ) ).toEqual(
					refusal.body
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should send the request while the API cache is off, though a refusal for the quota holds back the requests', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce(
					insightEndpoint,
					errorResponse( 429, {
						reason: 'RATE_LIMITED',
						retryAfter: 60,
					} )
				);

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();

				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				setUsingCache( false );

				try {
					const nextRegistry = createTestRegistry();
					provideResponseWithPayload( nextRegistry );

					expect( await resolveInsight( nextRegistry ) ).toEqual(
						benchmarkingInsight
					);
				} finally {
					setUsingCache( true );
				}

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should return null without an error, and keep it for a day, when the service has no visits to describe', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce(
					insightEndpoint,
					errorResponse( 400, { reason: 'NO_DATA' } )
				);

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				// A period without a visit is a state of the site, not a
				// failure.
				expect( getInsightError() ).toBeUndefined();
				expect( await getSharedItem( getCacheKey() ) ).toEqual( {
					cacheHit: true,
					value: { insight: null },
					isError: false,
				} );

				jest.setSystemTime( Date.now() + DAY_IN_SECONDS * 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it( 'should ask again after the `retryAfter` of a 503 with a code the store does not know, by its status', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce(
					insightEndpoint,
					errorResponse( 503, {
						reason: 'A_NEW_CODE',
						retryAfter: 1,
					} )
				);
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint );
			} );

			it( 'should not ask again after a 503 whose code says it is no refusal for capacity', async () => {
				const failure = errorResponse( 503, {
					reason: 'MODEL_UNAVAILABLE',
					retryAfter: 1,
				} );

				provideResponseWithPayload();
				fetchMock.post( insightEndpoint, failure );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );
				expect( getInsightError() ).toEqual( failure.body );
			} );

			it( 'should keep no failure without a status, so the next load asks again', async () => {
				provideResponseWithPayload();
				fetchMock.post( insightEndpoint, {
					throws: new Error( 'The network is down.' ),
				} );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();

				const nextRegistry = createTestRegistry();
				provideResponseWithPayload( nextRegistry );

				await resolveInsight( nextRegistry );

				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it.each( [
				[ 409, 'GENERATION_IN_PROGRESS' ],
				[ 503, 'SERVICE_BUSY' ],
			] )(
				'should stop asking at the deadline when the service keeps refusing the request with a %d',
				async ( status, reason ) => {
					const refusal = errorResponse( status, {
						reason,
						retryAfter: 5,
					} );

					provideResponseWithPayload();
					fetchMock.post( insightEndpoint, refusal );

					expect( await resolveInsight() ).toBeNull();
					expect( console ).toHaveErrored();
					// The store asks every five seconds, and gives up before a
					// request that it would send at the deadline.
					expect( fetchMock ).toHaveFetchedTimes(
						AI_INSIGHT_DEADLINE / AI_INSIGHT_RETRY_INTERVAL,
						insightEndpoint,
						{ method: 'POST' }
					);
					expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
						method: 'GET',
					} );
					// The store reports the refusal, and keeps nothing.
					expect( getInsightError() ).toEqual( refusal.body );
					expect(
						await getSharedItem( getCacheKey() )
					).toMatchObject( {
						cacheHit: false,
					} );
				}
			);

			it( 'should drop the operation, and keep the refusal, when a read of the operation is refused for permissions', async () => {
				const refusal = errorResponse( 403, {
					reason: 'PERMISSION_DENIED',
				} );

				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, refusal );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( getInsightError() ).toEqual( refusal.body );
				// The refusal replaces the operation in the cache entry.
				expect( await getSharedItem( getCacheKey() ) ).toEqual( {
					cacheHit: true,
					value: { error: refusal.body },
					isError: false,
				} );

				const nextRegistry = createTestRegistry();
				provideResponseWithPayload( nextRegistry );

				expect( await resolveInsight( nextRegistry ) ).toBeNull();
				expect( getInsightError( nextRegistry ) ).toEqual(
					refusal.body
				);
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );

			it( 'should drop the operation, and keep the refusal for a day, when a read of the operation is refused as invalid', async () => {
				const refusal = errorResponse( 400, {
					reason: 'INVALID_ARGUMENT',
				} );

				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, refusal );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( getInsightError() ).toEqual( refusal.body );
				// The refusal replaces the operation in the cache entry.
				expect( await getSharedItem( getCacheKey() ) ).toEqual( {
					cacheHit: true,
					value: { error: refusal.body },
					isError: false,
				} );

				jest.setSystemTime( Date.now() + DAY_IN_SECONDS * 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it( 'should keep the operation when a read of it fails without a status', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, {
					throws: new Error( 'The network is down.' ),
				} );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();
				expect( getInsightError() ).toMatchObject( {
					code: 'fetch_error',
				} );
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'POST',
				} );
				// The next load reads the operation again.
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { operationID: 'operation-1' },
				} );
			} );

			it( 'should return null with an error, and keep it for an hour in place of the operation, when the operation is done without an insight', async () => {
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: { done: true, state: 'SUCCEEDED' },
				} );

				expect( await resolveInsight() ).toBeNull();
				expect( getInsightError() ).toMatchObject( {
					code: 'invalid_benchmarking_insight_response',
				} );
				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: {
						error: {
							code: 'invalid_benchmarking_insight_response',
						},
					},
				} );

				jest.setSystemTime( Date.now() + HOUR_IN_SECONDS * 1000 );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			} );

			it.each( [
				[ 'a string', 'An insight.' ],
				[ 'an empty object', {} ],
				[ 'an insight that is no object', { insight: 'An insight.' } ],
				[ 'an error that is no object', { error: 'An error.' } ],
				[
					'an operation without the time it started',
					{ operationID: 'operation-1' },
				],
			] )(
				'should ask for the insight when the cache entry is %s',
				async ( _, entry ) => {
					await setSharedItem( getCacheKey(), entry, {
						ttl: DAY_IN_SECONDS,
					} );
					provideResponseWithPayload();
					fetchMock.postOnce( insightEndpoint, {
						body: { insight: benchmarkingInsight },
					} );

					expect( await resolveInsight() ).toEqual(
						benchmarkingInsight
					);
					expect( fetchMock ).toHaveFetchedTimes( 1 );
					// The insight replaces the entry the store could not use.
					expect(
						await getSharedItem( getCacheKey() )
					).toMatchObject( {
						cacheHit: true,
						value: { insight: benchmarkingInsight },
					} );
				}
			);

			it( 'should keep the insight of another request when it asks for an insight', async () => {
				const otherRangeKey = getCacheKey( otherPayload );

				await setSharedItem(
					otherRangeKey,
					{ insight: benchmarkingInsight },
					{ ttl: DAY_IN_SECONDS }
				);
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
					method: 'POST',
				} );
				// A request to a datapoint clears the cache entries of that
				// datapoint, which the insights the store keeps are not.
				expect( await getSharedItem( otherRangeKey ) ).toMatchObject( {
					cacheHit: true,
					value: { insight: benchmarkingInsight },
				} );
			} );

			it( 'should neither read nor write the cache entry while the API cache is off', async () => {
				await setSharedItem(
					getCacheKey(),
					{
						insight: {
							...benchmarkingInsight,
							analysis: 'Cached.',
						},
					},
					{ ttl: DAY_IN_SECONDS }
				);
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				setUsingCache( false );

				try {
					expect( await resolveInsight() ).toEqual(
						benchmarkingInsight
					);
				} finally {
					setUsingCache( true );
				}

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					value: { insight: { analysis: 'Cached.' } },
				} );
			} );
		} );

		describe( 'receiveBenchmarkingInsight', () => {
			it( 'should store the insight for the date range', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveBenchmarkingInsight( benchmarkingInsight, {
						startDate,
						endDate,
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toEqual( benchmarkingInsight );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, '2026-09-16' )
				).toBeUndefined();
			} );

			it( 'should require an object or null', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveBenchmarkingInsight( 'An insight.', {
							startDate,
							endDate,
						} )
				).toThrow( 'insight must be an object or null.' );
			} );
		} );

		describe( 'clearBenchmarkingData', () => {
			const otherStartDate = '2026-06-18';

			it( 'should delete the insight of the dates from the store and its cache entry, and keep the insight of another date range', async () => {
				// The benchmarking response of another date range carries
				// another request.
				const otherRangeKey = getCacheKey( otherPayload );

				provideResponseWithPayload();
				provideBenchmarkingInsight( registry, { startDate, endDate } );
				provideBenchmarkingInsight( registry, {
					startDate: otherStartDate,
					endDate,
				} );
				await setSharedItem(
					getCacheKey(),
					{ insight: benchmarkingInsight },
					{ ttl: DAY_IN_SECONDS }
				);
				await setSharedItem(
					otherRangeKey,
					{ insight: benchmarkingInsight },
					{ ttl: DAY_IN_SECONDS }
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearBenchmarkingData( startDate, endDate );

				expect( await getSharedItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
				expect( await getSharedItem( otherRangeKey ) ).toMatchObject( {
					cacheHit: true,
					value: { insight: benchmarkingInsight },
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( otherStartDate, endDate )
				).toEqual( benchmarkingInsight );

				// Selecting the insight starts a new resolution, which waits for
				// a new benchmarking response.
				freezeFetch( benchmarkingDataEndpoint );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getBenchmarkingInsight( startDate, endDate )
				).toBeUndefined();
			} );

			it( 'should ask for the insight again when its dates are selected again', async () => {
				fetchMock.getOnce( benchmarkingDataEndpoint, {
					body: [ ...benchmarkingData, locale, payload ],
				} );
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearBenchmarkingData( startDate, endDate );

				fetchMock.getOnce( benchmarkingDataEndpoint, {
					body: [ ...benchmarkingData, locale, payload ],
				} );
				fetchMock.postOnce( insightEndpoint, {
					body: {
						insight: {
							...benchmarkingInsight,
							analysis: 'A new insight.',
						},
					},
				} );

				expect( await resolveInsight() ).toMatchObject( {
					analysis: 'A new insight.',
				} );
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
					method: 'POST',
				} );
			} );

			it( 'should send no request when the store has no benchmarking response for the dates', async () => {
				provideBenchmarkingInsight( registry, { startDate, endDate } );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearBenchmarkingData( startDate, endDate );

				expect( fetchMock ).not.toHaveFetched();
			} );
		} );

		describe( 'clearBenchmarkingInsight', () => {
			it( 'should throw an error when a date is not written as `YYYY-MM-DD`, such as `2026-8-19`', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.clearBenchmarkingInsight( '2026-8-19', endDate )
				).toThrow( 'Valid startDate and endDate values are required' );
			} );
		} );
	} );
} );
