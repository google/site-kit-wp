/**
 * `modules/analytics-4` data store: benchmarking insight tests.
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
import { getItem, setItem } from '@/js/googlesitekit/api/cache';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { BenchmarkingInsight } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import {
	benchmarkingInsight,
	decodedBenchmarkingResponse,
	provideBenchmarkingData,
	provideBenchmarkingInsight,
} from './__factories__/benchmarking';
import {
	BENCHMARKING_INSIGHT_DEADLINE,
	BENCHMARKING_INSIGHT_OPERATION_LIFETIME,
	BENCHMARKING_INSIGHT_POLL_INTERVAL,
	BENCHMARKING_INSIGHT_RETRY_INTERVAL,
} from './benchmarking-insight';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 benchmarking-insight', () => {
	const startDate = '2026-08-19';
	const endDate = '2026-09-15';
	const locale = 'en_US';
	const payload = 'eyJsb2NhbGUiOiJlbl9VUyJ9.c2lnbmF0dXJl';

	const benchmarkingDataEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
	);
	const insightEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-insight'
	);

	const runningOperation = { done: false, state: 'RUNNING' };
	const succeededOperation = {
		done: true,
		state: 'SUCCEEDED',
		insight: benchmarkingInsight,
	};

	let registry: WPDataRegistry;

	beforeEach( () => {
		jest.useFakeTimers();
		registry = createTestRegistry();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	/**
	 * Gets the key of the insight's cache entry.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [entryLocale] Optional. The locale of the insight. Default is `en_US`.
	 * @return {string} The key.
	 */
	function getCacheKey( entryLocale = locale ) {
		return createCacheKey(
			'modules',
			'analytics-4',
			'benchmarking-generated-insight',
			{ startDate, endDate, locale: entryLocale }
		);
	}

	/**
	 * Stores a benchmarking response with the insight's request.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [targetRegistry] Optional. The registry to store it in. Default is the test's registry.
	 * @param {string} [insightLocale]  Optional. The locale of the insight. Default is `en_US`.
	 * @return {void}
	 */
	function provideResponseWithPayload(
		targetRegistry = registry,
		insightLocale = locale
	) {
		provideBenchmarkingData(
			targetRegistry,
			{ startDate, endDate },
			{
				...decodedBenchmarkingResponse,
				insightLocale,
				insightPayload: payload,
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
			BENCHMARKING_INSIGHT_DEADLINE + BENCHMARKING_INSIGHT_POLL_INTERVAL
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
			fetchMock.getOnce( benchmarkingDataEndpoint, errorResponse( 500 ) );

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
			fetchMock.getOnce( insightEndpoint, { body: runningOperation } );
			fetchMock.getOnce( insightEndpoint, { body: succeededOperation } );

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
				BENCHMARKING_INSIGHT_POLL_INTERVAL - 1
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

			await jest.advanceTimersByTimeAsync(
				BENCHMARKING_INSIGHT_POLL_INTERVAL
			);

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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
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

			expect( await getItem( getCacheKey() ) ).toEqual( {
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
			'should ask again after five seconds when the service refuses the request with a %d',
			async ( status, reason ) => {
				provideResponseWithPayload();
				fetchMock.postOnce(
					insightEndpoint,
					errorResponse( status, { reason, retryAfter: 5 } )
				);
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getBenchmarkingInsight( startDate, endDate );

				await jest.advanceTimersByTimeAsync(
					BENCHMARKING_INSIGHT_RETRY_INTERVAL - 1
				);

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint );
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
			[ 'has expired', errorResponse( 404, { reason: 'NOT_FOUND' } ) ],
			[
				'was interrupted',
				errorResponse(
					503,
					{ reason: 'UNAVAILABLE' },
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

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
					method: 'POST',
				} );
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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should ask for the insight again, once, when an operation from the cache entry still runs two minutes after it started', async () => {
			provideResponseWithPayload();
			await setItem(
				getCacheKey(),
				{
					operationID: 'operation-1',
					createdAt:
						Date.now() - BENCHMARKING_INSIGHT_OPERATION_LIFETIME,
				},
				{ ttl: HOUR_IN_SECONDS }
			);
			fetchMock.getOnce( insightEndpoint, { body: runningOperation } );
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
			await setItem(
				getCacheKey(),
				{ operationID: 'operation-1', createdAt: Date.now() - 5000 },
				{ ttl: HOUR_IN_SECONDS }
			);
			fetchMock.getOnce( insightEndpoint, { body: succeededOperation } );

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

		it( 'should return null, and keep the error and the operation, when the generation fails', async () => {
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
					.getErrorForSelector( 'getBenchmarkingInsightOperation', [
						'operation-1',
					] )
			).toBeUndefined();
			// A reload reads the failed operation, rather than asking for a
			// generation the service would charge again.
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
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
				BENCHMARKING_INSIGHT_DEADLINE /
					BENCHMARKING_INSIGHT_POLL_INTERVAL -
					1,
				insightEndpoint,
				{ method: 'GET' }
			);
			expect( getInsightError() ).toMatchObject( {
				code: 'benchmarking_insight_timeout',
			} );
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
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

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
			} );

			jest.setSystemTime( Date.now() + 1000 );

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should ask for a new insight when the locale changes', async () => {
			await setItem(
				getCacheKey( 'en_US' ),
				{ insight: benchmarkingInsight },
				{ ttl: DAY_IN_SECONDS }
			);
			provideResponseWithPayload( registry, 'de_DE' );
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
			[ 'the rate limit, for an hour', 429, 60, HOUR_IN_SECONDS ],
			[
				'the rate limit without a Retry-After, for an hour',
				429,
				undefined,
				HOUR_IN_SECONDS,
			],
			[
				'the daily cap, until its Retry-After',
				429,
				7200,
				2 * HOUR_IN_SECONDS,
			],
			[ 'the daily cap, for up to a day', 429, 200000, DAY_IN_SECONDS ],
			[ 'permissions, for an hour', 403, undefined, HOUR_IN_SECONDS ],
		] )(
			'should keep a refusal for %s, so the next load sends no request',
			async ( _, status, retryAfter, lifetime ) => {
				const refusal = errorResponse( status, { retryAfter } );

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

				expect( await getItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
				} );

				jest.setSystemTime( Date.now() + 1000 );

				expect( await getItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			}
		);

		it( 'should keep no other failure, so the next load asks again', async () => {
			provideResponseWithPayload();
			fetchMock.post( insightEndpoint, errorResponse( 500 ) );

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
					BENCHMARKING_INSIGHT_DEADLINE /
						BENCHMARKING_INSIGHT_RETRY_INTERVAL,
					insightEndpoint,
					{ method: 'POST' }
				);
				expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
					method: 'GET',
				} );
				// The store reports the refusal, and keeps nothing.
				expect( getInsightError() ).toEqual( refusal.body );
				expect( await getItem( getCacheKey() ) ).toMatchObject( {
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
			expect( await getItem( getCacheKey() ) ).toEqual( {
				cacheHit: true,
				value: { error: refusal.body },
				isError: false,
			} );

			const nextRegistry = createTestRegistry();
			provideResponseWithPayload( nextRegistry );

			expect( await resolveInsight( nextRegistry ) ).toBeNull();
			expect( getInsightError( nextRegistry ) ).toEqual( refusal.body );
			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		it( 'should drop the operation, and keep nothing, when a read of the operation is refused as invalid', async () => {
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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
			} );
		} );

		it( 'should return null with an error, and keep the operation, when the operation is done without an insight', async () => {
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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
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
				await setItem( getCacheKey(), entry, { ttl: DAY_IN_SECONDS } );
				provideResponseWithPayload();
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: benchmarkingInsight },
				} );

				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				// The insight replaces the entry the store could not use.
				expect( await getItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { insight: benchmarkingInsight },
				} );
			}
		);

		it( 'should keep the insight of another date range when it asks for an insight', async () => {
			const otherRangeKey = createCacheKey(
				'modules',
				'analytics-4',
				'benchmarking-generated-insight',
				{ startDate: '2026-06-18', endDate, locale }
			);

			await setItem(
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
			expect( await getItem( otherRangeKey ) ).toMatchObject( {
				cacheHit: true,
				value: { insight: benchmarkingInsight },
			} );
		} );

		it( 'should neither read nor write the cache entry while the API cache is off', async () => {
			await setItem(
				getCacheKey(),
				{ insight: { ...benchmarkingInsight, analysis: 'Cached.' } },
				{ ttl: DAY_IN_SECONDS }
			);
			provideResponseWithPayload();
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: benchmarkingInsight },
			} );

			setUsingCache( false );

			try {
				expect( await resolveInsight() ).toEqual( benchmarkingInsight );
			} finally {
				setUsingCache( true );
			}

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
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
			const otherRangeKey = createCacheKey(
				'modules',
				'analytics-4',
				'benchmarking-generated-insight',
				{ startDate: otherStartDate, endDate, locale }
			);

			provideResponseWithPayload();
			provideBenchmarkingInsight( registry, { startDate, endDate } );
			provideBenchmarkingInsight( registry, {
				startDate: otherStartDate,
				endDate,
			} );
			await setItem(
				getCacheKey(),
				{ insight: benchmarkingInsight },
				{ ttl: DAY_IN_SECONDS }
			);
			await setItem(
				otherRangeKey,
				{ insight: benchmarkingInsight },
				{ ttl: DAY_IN_SECONDS }
			);

			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.clearBenchmarkingData( startDate, endDate );

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
			expect( await getItem( otherRangeKey ) ).toMatchObject( {
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
