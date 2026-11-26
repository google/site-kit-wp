/**
 * `modules/analytics-4` data store: conversion insights tests.
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
import { createCacheKey } from '@/js/googlesitekit/api';
import {
	STORAGE_KEY_PREFIX,
	getItem,
	setItem,
} from '@/js/googlesitekit/api/cache';
import { conversionInsight } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import { createTestRegistry, freezeFetch } from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 conversion-insights', () => {
	const insightEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
	);

	let registry: WPDataRegistry;

	beforeEach( () => {
		jest.useFakeTimers();
		registry = createTestRegistry();
	} );

	/**
	 * Gets the key of the cache entry of the insight of the lead widget.
	 *
	 * @since 1.193.0
	 *
	 * @param {string} [tabID]  Optional. The tab. Default is the whole widget.
	 * @param {string} [locale] Optional. The locale of the insight. Default is `en-US`, the locale of the test environment.
	 * @return {string} The key.
	 */
	function getCacheKey( tabID = '', locale = 'en-US' ) {
		return createCacheKey(
			'modules',
			'analytics-4',
			'conversion-generated-insight',
			{ goalType: 'lead', tabID, endDate: '2026-11-01', locale }
		);
	}

	/**
	 * Runs the timers, 100 milliseconds at a time, until the resolution of the
	 * insight of the lead widget has finished.
	 *
	 * @since 1.193.0
	 *
	 * @param {Object} targetRegistry        The registry that resolves the insight.
	 * @param {number} remainingMilliseconds The longest time to run the timers for.
	 * @return {Promise} A promise that resolves once the resolution has finished.
	 */
	async function runTimersUntilResolved(
		targetRegistry: WPDataRegistry,
		remainingMilliseconds: number
	): Promise< void > {
		if (
			targetRegistry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getConversionInsight', [
					'lead',
					'',
					'2026-11-01',
				] )
		) {
			return;
		}

		if ( remainingMilliseconds < 0 ) {
			throw new Error( 'getConversionInsight() did not resolve.' );
		}

		await jest.advanceTimersByTimeAsync( 100 );
		await runTimersUntilResolved(
			targetRegistry,
			remainingMilliseconds - 100
		);
	}

	/**
	 * Selects the insight of the lead widget, and runs the timers until its
	 * resolution has finished.
	 *
	 * @since 1.193.0
	 *
	 * @param {Object} [targetRegistry] Optional. The registry that resolves the insight. Default is the test's registry.
	 * @return {Promise<(Object|null)>} The insight, or null.
	 */
	async function resolveInsight( targetRegistry = registry ) {
		targetRegistry
			.select( MODULES_ANALYTICS_4 )
			.getConversionInsight( 'lead', '', '2026-11-01' );

		await jest.advanceTimersByTimeAsync( 0 );
		await runTimersUntilResolved( targetRegistry, 62 * 1000 );

		return targetRegistry
			.select( MODULES_ANALYTICS_4 )
			.getConversionInsight( 'lead', '', '2026-11-01' );
	}

	/**
	 * Gets the error the resolution of the insight of the lead widget stopped
	 * with.
	 *
	 * @since 1.193.0
	 *
	 * @param {Object} [targetRegistry] Optional. The registry that resolved the insight. Default is the test's registry.
	 * @return {(Object|undefined)} The error, if there is one.
	 */
	function getInsightError( targetRegistry = registry ) {
		return targetRegistry
			.select( MODULES_ANALYTICS_4 )
			.getErrorForSelector( 'getConversionInsight', [
				'lead',
				'',
				'2026-11-01',
			] );
	}

	/**
	 * Builds the response of a request that the datapoint refused.
	 *
	 * @since 1.193.0
	 *
	 * @param {number} status The status of the response.
	 * @param {Object} [data] Optional. More data of the error, such as `reason` and `retryAfter`.
	 * @param {string} [code] Optional. The code of the error. Default is `request_failed`.
	 * @return {Object} The response, with its `body` and `status`.
	 */
	function errorResponse(
		status: number,
		data: Record< string, unknown > = {},
		code = 'request_failed'
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

	describe( 'getConversionInsight', () => {
		it( 'should return `undefined` while the insight loads', async () => {
			freezeFetch( { url: insightEndpoint, method: 'POST' } );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', '2026-11-01' )
			).toBeUndefined();
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight( 'lead', '', '2026-11-01' )
			).toBe( true );
		} );

		it( 'should send the goal type, the tab and the end date, and return the insight the service already had without a read', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight(
					'ecommerce',
					'woocommerce',
					'2026-11-01'
				);

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched( insightEndpoint, {
				method: 'POST',
				body: {
					data: {
						goalType: 'ecommerce',
						tab: 'woocommerce',
						endDate: '2026-11-01',
					},
				},
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight(
						'ecommerce',
						'woocommerce',
						'2026-11-01'
					)
			).toEqual( conversionInsight );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight(
						'ecommerce',
						'woocommerce',
						'2026-11-01'
					)
			).toBe( false );
		} );

		it( 'should return null without a read when the service has no insight to write', async () => {
			fetchMock.postOnce( insightEndpoint, { body: { insight: null } } );

			expect( await resolveInsight() ).toBeNull();
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( getInsightError() ).toBeUndefined();
		} );

		it( 'should send 1 submit and 4 reads, two seconds apart, for a generation that runs on the first 3 reads, and keep loading between the reads', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: {
					done: true,
					state: 'SUCCEEDED',
					insight: conversionInsight,
				},
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );

			await jest.advanceTimersByTimeAsync( 1999 );

			expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
				method: 'GET',
			} );

			for ( let read = 1; read <= 3; read++ ) {
				await jest.advanceTimersByTimeAsync( read === 1 ? 1 : 2000 );

				expect( fetchMock ).toHaveFetchedTimes( read, insightEndpoint, {
					method: 'GET',
					query: { operationID: 'operation-1' },
				} );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingConversionInsight( 'lead', '', '2026-11-01' )
				).toBe( true );
			}

			await jest.advanceTimersByTimeAsync( 2000 );

			expect( fetchMock ).toHaveFetchedTimes( 4, insightEndpoint, {
				method: 'GET',
			} );
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', '2026-11-01' )
			).toEqual( conversionInsight );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight( 'lead', '', '2026-11-01' )
			).toBe( false );
		} );

		it( 'should return null when the generation succeeds without an insight', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: { done: true, state: 'SUCCEEDED', insight: null },
			} );

			expect( await resolveInsight() ).toBeNull();
			expect( getInsightError() ).toBeUndefined();
		} );

		it( 'should return null with the error the datapoint returned when the generation fails, and submit again on the next load', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.getOnce(
				insightEndpoint,
				errorResponse(
					500,
					{ reason: 'INTERNAL' },
					'conversion_insight_failed'
				)
			);

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();
			expect( getInsightError() ).toEqual( {
				code: 'conversion_insight_failed',
				message: 'The service refused the request.',
				data: { status: 500, reason: 'INTERNAL' },
			} );
			// The error of each request is moved to the outcome.
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'getConversionInsightOperation', [
						'operation-1',
					] )
			).toBeUndefined();

			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			expect( await resolveInsight( createTestRegistry() ) ).toEqual(
				conversionInsight
			);
			expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint, {
				method: 'POST',
			} );
		} );

		it( 'should delete the operation, and keep nothing, when the service refuses a read as invalid', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.getOnce(
				insightEndpoint,
				errorResponse( 400, { reason: 'INVALID_ARGUMENT' } )
			);

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should keep the operation when the service answers a read with an error other than a failed generation', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			// The datapoint answers a read that ran past the service's time
			// limit with a 500, while the generation may still run.
			fetchMock.getOnce( insightEndpoint, errorResponse( 500 ) );

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();
			expect( getInsightError() ).toMatchObject( {
				code: 'request_failed',
				data: { status: 500 },
			} );
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
			} );
		} );

		it( 'should keep the operation when a read of it gets no answer', async () => {
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
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
			} );
		} );

		it( 'should delete a done operation without an insight to read', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.getOnce( insightEndpoint, {
				body: { done: true, state: 'SUCCEEDED' },
			} );

			expect( await resolveInsight() ).toBeNull();
			expect( getInsightError() ).toMatchObject( {
				code: 'invalid_conversion_insight_response',
			} );
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should store the error before the null insight, so a listener that reads the null insight also reads the error', async () => {
			fetchMock.postOnce( insightEndpoint, errorResponse( 500 ) );

			const errorsWithNullInsight: unknown[] = [];
			const unsubscribe = registry.subscribe( () => {
				if (
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConversionInsight( 'lead', '', '2026-11-01' ) ===
					null
				) {
					errorsWithNullInsight.push( getInsightError() );
				}
			} );

			await resolveInsight();
			unsubscribe();

			expect( console ).toHaveErrored();
			expect( errorsWithNullInsight[ 0 ] ).toMatchObject( {
				data: { status: 500 },
			} );
		} );

		it( 'should submit when the stored entry is not valid JSON', async () => {
			sessionStorage.setItem(
				`${ STORAGE_KEY_PREFIX }${ getCacheKey() }`,
				'{"timestamp":'
			);
			localStorage.setItem(
				`${ STORAGE_KEY_PREFIX }${ getCacheKey() }`,
				'{"timestamp":'
			);
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			expect( await resolveInsight() ).toEqual( conversionInsight );
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
		} );

		it( 'should return null with an error when the service returns neither an insight nor an operation', async () => {
			fetchMock.postOnce( insightEndpoint, { body: {} } );

			expect( await resolveInsight() ).toBeNull();
			expect( getInsightError() ).toMatchObject( {
				code: 'invalid_conversion_insight_response',
				data: { status: 500 },
			} );
		} );

		it.each( [ 409, 503 ] )(
			'should submit again five seconds after the service answers a submit with a %d',
			async ( status ) => {
				fetchMock.postOnce(
					insightEndpoint,
					// The store waits five seconds whatever `retryAfter`
					// the service sends.
					errorResponse( status, { retryAfter: 1 } )
				);
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: conversionInsight },
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', '2026-11-01' );

				await jest.advanceTimersByTimeAsync( 4999 );

				expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( console ).toHaveErrored();
				expect( fetchMock ).toHaveFetchedTimes( 2, insightEndpoint );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getConversionInsight( 'lead', '', '2026-11-01' )
				).toEqual( conversionInsight );
				expect( getInsightError() ).toBeUndefined();
				// The store reports the outcome alone.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForSelector( 'submitConversionInsight', [
							'lead',
							'',
							'2026-11-01',
						] )
				).toBeUndefined();
			}
		);

		it.each( [
			[ 'has expired', 404, 'request_failed' ],
			[ 'failed with code 503', 503, 'conversion_insight_failed' ],
		] )(
			'should submit again when the operation %s',
			async ( _, status, code ) => {
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-1' },
				} );
				fetchMock.getOnce(
					insightEndpoint,
					errorResponse( status, {}, code )
				);
				fetchMock.postOnce( insightEndpoint, {
					body: { operationID: 'operation-2' },
				} );
				fetchMock.getOnce( insightEndpoint, {
					body: {
						done: true,
						state: 'SUCCEEDED',
						insight: conversionInsight,
					},
				} );

				expect( await resolveInsight() ).toEqual( conversionInsight );
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

		it( 'should give up when a second operation has expired too', async () => {
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
			// The expired operation is deleted, so the next load submits.
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should read a stored operation on reload without a submit', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			freezeFetch( { url: insightEndpoint, method: 'GET' } );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( await getItem( getCacheKey() ) ).toEqual( {
				cacheHit: true,
				value: { operationID: 'operation-1', createdAt: Date.now() },
				isError: false,
			} );

			fetchMock.reset();
			fetchMock.getOnce( insightEndpoint, {
				body: {
					done: true,
					state: 'SUCCEEDED',
					insight: conversionInsight,
				},
			} );

			const nextRegistry = createTestRegistry();
			nextRegistry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched( insightEndpoint, {
				method: 'GET',
				query: { operationID: 'operation-1' },
			} );
			expect(
				nextRegistry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', '2026-11-01' )
			).toEqual( conversionInsight );

			// The insight replaces the operation.
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { insight: conversionInsight },
			} );
		} );

		it( 'should keep a running operation for an hour', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			freezeFetch( { url: insightEndpoint, method: 'GET' } );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			// The API cache counts in whole seconds, so the checks leave a
			// second on each side of the lifetime.
			jest.setSystemTime( Date.now() + HOUR_IN_SECONDS * 1000 - 2000 );

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
			} );

			jest.setSystemTime( Date.now() + 3000 );

			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: false,
			} );
		} );

		it( 'should submit again when a stored operation still runs two minutes after its submit', async () => {
			await setItem(
				getCacheKey(),
				{
					operationID: 'operation-1',
					createdAt: Date.now() - 2 * 60 * 1000,
				},
				{ ttl: HOUR_IN_SECONDS }
			);
			fetchMock.getOnce( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			expect( await resolveInsight() ).toEqual( conversionInsight );
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'GET',
				query: { operationID: 'operation-1' },
			} );
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
		} );

		it( 'should stop waiting 60 seconds after its first submit, and keep the operation for the next load', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.get( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );

			const startTime = Date.now();

			expect( await resolveInsight() ).toBeNull();
			// The store gives up when the wait before the next read would
			// reach the deadline, rather than wait for nothing.
			expect( Date.now() - startTime ).toBeLessThan( 60 * 1000 );
			// The store reads the operation every two seconds: 29 reads in
			// 60 seconds.
			expect( fetchMock ).toHaveFetchedTimes( 29, insightEndpoint, {
				method: 'GET',
			} );

			await jest.advanceTimersByTimeAsync( 60 * 1000 );

			expect( fetchMock ).toHaveFetchedTimes( 30, insightEndpoint );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight( 'lead', '', '2026-11-01' )
			).toBe( false );
			expect( getInsightError() ).toMatchObject( {
				code: 'conversion_insight_timeout',
			} );
			expect( await getItem( getCacheKey() ) ).toMatchObject( {
				cacheHit: true,
				value: { operationID: 'operation-1' },
			} );
		} );

		it( 'should stop submitting 60 seconds after its first submit when the service keeps answering 409', async () => {
			fetchMock.post(
				insightEndpoint,
				errorResponse( 409, { reason: 'GENERATION_IN_PROGRESS' } )
			);

			const startTime = Date.now();

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();
			// The store gives up when the wait before the next submit would
			// reach the deadline, rather than wait for nothing.
			expect( Date.now() - startTime ).toBeLessThan( 60 * 1000 );
			// The store submits every five seconds: 12 in 60 seconds.
			expect( fetchMock ).toHaveFetchedTimes( 12, insightEndpoint, {
				method: 'POST',
			} );

			await jest.advanceTimersByTimeAsync( 60 * 1000 );

			expect( fetchMock ).toHaveFetchedTimes( 12, insightEndpoint );
			expect( getInsightError() ).toMatchObject( {
				data: { status: 409 },
			} );
		} );

		it.each( [
			[ 'an insight', conversionInsight ],
			[ 'an empty result', null ],
		] )(
			'should keep %s for a day, so the next load sends no request',
			async ( _, insight ) => {
				fetchMock.postOnce( insightEndpoint, { body: { insight } } );

				await resolveInsight();

				expect( await resolveInsight( createTestRegistry() ) ).toEqual(
					insight
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// The API cache counts in whole seconds, so the checks leave a
				// second on each side of the lifetime.
				jest.setSystemTime( Date.now() + DAY_IN_SECONDS * 1000 - 2000 );

				expect( await getItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: true,
					value: { insight },
				} );

				jest.setSystemTime( Date.now() + 3000 );

				expect( await getItem( getCacheKey() ) ).toMatchObject( {
					cacheHit: false,
				} );
			}
		);

		it.each( [
			[ 'a 403, for an hour', 403, undefined, HOUR_IN_SECONDS ],
			[ 'a 429, for an hour', 429, 60, HOUR_IN_SECONDS ],
			[
				'a 429, for as long as its retryAfter asks',
				429,
				7200,
				2 * HOUR_IN_SECONDS,
			],
			[ 'a 429, for up to a day', 429, 200000, DAY_IN_SECONDS ],
		] )(
			'should keep %s, and submit again after it',
			async ( _, status, retryAfter, lifetime ) => {
				const refusal = errorResponse( status, { retryAfter } );

				fetchMock.postOnce( insightEndpoint, refusal );

				expect( await resolveInsight() ).toBeNull();
				expect( console ).toHaveErrored();

				// The API cache counts in whole seconds, so the checks leave
				// a second on each side of the lifetime.
				jest.setSystemTime( Date.now() + lifetime * 1000 - 2000 );

				const nextRegistry = createTestRegistry();

				expect( await resolveInsight( nextRegistry ) ).toBeNull();
				expect( getInsightError( nextRegistry ) ).toEqual(
					refusal.body
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				jest.setSystemTime( Date.now() + 3000 );
				fetchMock.postOnce( insightEndpoint, {
					body: { insight: conversionInsight },
				} );

				expect( await resolveInsight( createTestRegistry() ) ).toEqual(
					conversionInsight
				);
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			}
		);

		it( 'should keep no other failure, so the next load submits again', async () => {
			fetchMock.post( insightEndpoint, errorResponse( 500 ) );

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();

			// The store reports the outcome alone.
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForSelector( 'submitConversionInsight', [
						'lead',
						'',
						'2026-11-01',
					] )
			).toBeUndefined();

			await resolveInsight( createTestRegistry() );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
		} );

		it( 'should ask for a new insight when the locale of the user changes, and keep it under that locale', async () => {
			await setItem(
				getCacheKey(),
				{ insight: conversionInsight },
				{ ttl: DAY_IN_SECONDS }
			);
			fetchMock.postOnce( insightEndpoint, {
				body: {
					insight: { ...conversionInsight, text: 'Auf Deutsch.' },
				},
			} );

			global._googlesitekitLegacyData.locale = 'de_DE';

			try {
				expect( await resolveInsight() ).toMatchObject( {
					text: 'Auf Deutsch.',
				} );
			} finally {
				delete global._googlesitekitLegacyData.locale;
			}

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( await getItem( getCacheKey( '', 'de-DE' ) ) ).toMatchObject(
				{
					cacheHit: true,
					value: { insight: { text: 'Auf Deutsch.' } },
				}
			);
		} );

		it( 'should send 1 submit for two selections of the same goal type, tab and end date', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );
			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		it( 'should keep the stored result of another tab when it submits', async () => {
			await setItem(
				getCacheKey( '123' ),
				{ insight: conversionInsight },
				{ ttl: DAY_IN_SECONDS }
			);
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			await resolveInsight();

			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
			// A request to a datapoint clears the cache entries of that
			// datapoint, which the insights the store keeps are not.
			expect( await getItem( getCacheKey( '123' ) ) ).toMatchObject( {
				cacheHit: true,
				value: { insight: conversionInsight },
			} );
		} );

		it( 'should submit when the stored operation has no ID', async () => {
			await setItem(
				getCacheKey(),
				{ operationID: '', createdAt: Date.now() },
				{ ttl: HOUR_IN_SECONDS }
			);
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			expect( await resolveInsight() ).toEqual( conversionInsight );
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
		} );

		it( 'should send no request, and not load, while the end date is not known yet', async () => {
			fetchMock.post( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			// A component may select the insight before its end date loads.
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', undefined )
			).toBeUndefined();

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight( 'lead', '', undefined )
			).toBe( false );
			// The store waits for an end date, rather than failing on the
			// one it doesn't know yet.
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.hasResolutionFailed( 'getConversionInsight', [
						'lead',
						'',
						undefined,
					] )
			).toBe( false );
		} );

		it( 'should send no request when it only checks whether the insight loads', async () => {
			fetchMock.post( insightEndpoint, {
				body: { insight: conversionInsight },
			} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.isLoadingConversionInsight( 'lead', '', '2026-11-01' )
			).toBe( false );

			await jest.advanceTimersByTimeAsync( 0 );

			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
		} );

		it( 'should send no read after the deadline when the device slept through the wait before it', async () => {
			fetchMock.postOnce( insightEndpoint, {
				body: { operationID: 'operation-1' },
			} );
			fetchMock.get( insightEndpoint, {
				body: { done: false, state: 'RUNNING' },
			} );

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			// The clock moves on by a minute while the timer of the wait
			// stands still, as it does on a sleeping device.
			jest.setSystemTime( Date.now() + 61 * 1000 );

			expect( await resolveInsight() ).toBeNull();
			expect( fetchMock ).not.toHaveFetched( insightEndpoint, {
				method: 'GET',
			} );
			expect( getInsightError() ).toMatchObject( {
				code: 'conversion_insight_timeout',
			} );
		} );

		it( 'should send no submit after the deadline when the device slept through the wait before it', async () => {
			fetchMock.post(
				insightEndpoint,
				errorResponse( 409, { reason: 'GENERATION_IN_PROGRESS' } )
			);

			registry
				.select( MODULES_ANALYTICS_4 )
				.getConversionInsight( 'lead', '', '2026-11-01' );

			await jest.advanceTimersByTimeAsync( 0 );

			jest.setSystemTime( Date.now() + 61 * 1000 );

			expect( await resolveInsight() ).toBeNull();
			expect( console ).toHaveErrored();
			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
			} );
		} );

		it( 'should send no request for an insight the store already has', async () => {
			fetchMock.post( insightEndpoint, {
				body: { insight: null },
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveConversionInsight( conversionInsight, {
					goalType: 'lead',
					tabID: '',
					endDate: '2026-11-01',
				} );

			expect( await resolveInsight() ).toEqual( conversionInsight );
			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
		} );
	} );

	describe( 'receiveConversionInsight', () => {
		it( 'should store the insight for its goal type, tab and end date', () => {
			freezeFetch( { url: insightEndpoint, method: 'POST' } );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveConversionInsight( conversionInsight, {
					goalType: 'lead',
					tabID: '123',
					endDate: '2026-11-01',
				} );

			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '123', '2026-11-01' )
			).toEqual( conversionInsight );
			expect(
				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionInsight( 'lead', '', '2026-11-01' )
			).toBeUndefined();
		} );
	} );
} );
