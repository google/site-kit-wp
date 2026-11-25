/**
 * `modules/analytics-4` data store: shared waiting logic of the generated insights tests.
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
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { createCacheKey } from '@/js/googlesitekit/api';
import {
	STORAGE_KEY_PREFIX,
	getSharedStorage,
	getStorage,
	setItem,
} from '@/js/googlesitekit/api/cache';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import {
	AIInsightErrorCode,
	AIInsightFetchResult,
	AIInsightOperationResponse,
	AIInsightOutcome,
	AIInsightRequest,
	AIInsightSubmitResponse,
	AI_INSIGHT_DEADLINE,
	AI_INSIGHT_ERROR_CODES,
	AI_INSIGHT_OPERATION_LIFETIME,
	AI_INSIGHT_POLL_INTERVAL,
	AI_INSIGHT_RATE_LIMIT_HOLD,
	AI_INSIGHT_RETRY_INTERVAL,
	getAIInsightErrorCode,
	getFailureLifetime,
	getQuotaHoldLifetime,
	getRetryAfterDelay,
	resolveAIInsight,
} from './ai-insight';

interface TestInsight {
	text: string;
}

type SubmitResult = AIInsightFetchResult<
	AIInsightSubmitResponse< TestInsight >
>;

type ReadResult = AIInsightFetchResult<
	AIInsightOperationResponse< TestInsight >
>;

interface TestRequest extends AIInsightRequest< TestInsight > {
	submit: jest.MockedFunction< AIInsightRequest< TestInsight >[ 'submit' ] >;
	readOperation: jest.MockedFunction<
		AIInsightRequest< TestInsight >[ 'readOperation' ]
	>;
}

const insight: TestInsight = { text: 'Your site had more visits than usual.' };
const otherInsight: TestInsight = { text: 'Your site had a typical week.' };

const cacheKey = createCacheKey(
	'modules',
	'analytics-4',
	'test-generated-insight',
	{ id: 'first' }
);
const otherCacheKey = createCacheKey(
	'modules',
	'analytics-4',
	'test-generated-insight',
	{ id: 'second' }
);
const quotaHoldCacheKey = createCacheKey(
	'modules',
	'analytics-4',
	'generated-insight-quota-hold'
);

const networkError: ErrorObject = {
	code: 'fetch_error',
	message: 'The network is down.',
};

/**
 * Builds the error of a request that the datapoint refused.
 *
 * @since n.e.x.t
 *
 * @param {number} [status] Optional. The status of the response. Default is none, as for a network error.
 * @param {Object} [data]   Optional. More data of the error, such as `reason` and `retryAfter`.
 * @param {string} [code]   Optional. The code of the error. Default is `test_insight_error`.
 * @return {Object} The error.
 */
function createError(
	status?: number,
	data: Record< string, unknown > = {},
	code = 'test_insight_error'
): ErrorObject {
	return {
		code,
		message: 'The service refused the request.',
		data: { status, ...data },
	};
}

/**
 * Builds the requests and the cache entry of an insight, with `submit` and
 * `readOperation` as mocks that each test answers.
 *
 * @since n.e.x.t
 *
 * @param {Object} [overrides] Optional. The properties of the request to change.
 * @return {Object} The request.
 */
function createRequest(
	overrides: Partial< AIInsightRequest< TestInsight > > = {}
): TestRequest {
	return {
		submit: jest.fn(),
		readOperation: jest.fn(),
		cacheKey,
		invalidResponseErrorCode: 'invalid_test_insight_response',
		timeoutErrorCode: 'test_insight_timeout',
		failedErrorCode: 'test_insight_failed',
		...overrides,
	} as TestRequest;
}

/**
 * Resolves an insight, and runs the timers until it has resolved.
 *
 * @since n.e.x.t
 *
 * @param {Object} request The requests and the cache entry of the insight.
 * @return {Promise<Object>} The outcome.
 */
async function resolveWithTimers(
	request: TestRequest
): Promise< AIInsightOutcome< TestInsight > > {
	const promise = resolveAIInsight( request );

	await jest.runAllTimersAsync();

	return promise;
}

/**
 * Reads an item of the API cache as it is stored, whether it has expired or
 * not.
 *
 * @since n.e.x.t
 *
 * @param {string}  key              The key of the item.
 * @param {Object}  [options]        Optional. Options for the read.
 * @param {boolean} [options.shared] Optional. Whether to read the item that every tab of the login session shares. Default is `false`.
 * @return {Promise<(Object|undefined)>} The item's `value` and `ttl`, or `undefined` when there is none.
 */
async function getStoredItem( key: string, { shared = false } = {} ) {
	const storage = shared ? await getSharedStorage() : await getStorage();
	const item = storage?.getItem( `${ STORAGE_KEY_PREFIX }${ key }` );

	if ( ! item ) {
		return undefined;
	}

	const { value, ttl } = JSON.parse( item );

	return { value, ttl };
}

describe( 'modules/analytics-4 ai-insight utils', () => {
	describe( 'AI_INSIGHT_ERROR_CODES', () => {
		it( 'should have each code of the service, as the service sends it', () => {
			expect( AI_INSIGHT_ERROR_CODES ).toEqual( {
				INVALID_ARGUMENT: 'INVALID_ARGUMENT',
				NO_DATA: 'NO_DATA',
				SITE_NOT_FOUND: 'SITE_NOT_FOUND',
				PERMISSION_DENIED: 'PERMISSION_DENIED',
				NOT_FOUND: 'NOT_FOUND',
				GENERATION_IN_PROGRESS: 'GENERATION_IN_PROGRESS',
				RATE_LIMITED: 'RATE_LIMITED',
				DAILY_CAP: 'DAILY_CAP',
				SERVICE_BUSY: 'SERVICE_BUSY',
				MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
				MODEL_OUTPUT_INVALID: 'MODEL_OUTPUT_INVALID',
				INTERNAL: 'INTERNAL',
			} );
		} );
	} );

	describe( 'timing constants', () => {
		it.each< [ string, number, number ] >( [
			// The time limit of the service's worker.
			[ 'AI_INSIGHT_DEADLINE', 60 * 1000, AI_INSIGHT_DEADLINE ],
			// The `Retry-After` of an operation that runs.
			[ 'AI_INSIGHT_POLL_INTERVAL', 2 * 1000, AI_INSIGHT_POLL_INTERVAL ],
			// The `Retry-After` of a 409 or a 503.
			[
				'AI_INSIGHT_RETRY_INTERVAL',
				5 * 1000,
				AI_INSIGHT_RETRY_INTERVAL,
			],
			// The longest the service's client contract reads an operation.
			[
				'AI_INSIGHT_OPERATION_LIFETIME',
				2 * 60 * 1000,
				AI_INSIGHT_OPERATION_LIFETIME,
			],
			// In seconds: the rate limit refills two generations an hour.
			[
				'AI_INSIGHT_RATE_LIMIT_HOLD',
				30 * 60,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
		] )( 'should set `%s` to %d', ( _, expected, value ) => {
			expect( value ).toBe( expected );
		} );
	} );

	describe( 'getRetryAfterDelay', () => {
		it.each< [ number, number ] >( [
			[ 3000, 3 ],
			[ 1500, 1.5 ],
			[ 1000, 1 ],
			// There is no longest wait.
			[ 120000, 120 ],
			// The store never waits less than a second.
			[ 1000, 0 ],
			[ 1000, 0.2 ],
		] )(
			'should wait %d milliseconds for a `retryAfter` of %p seconds',
			( expected, retryAfter ) => {
				expect(
					getRetryAfterDelay( retryAfter, AI_INSIGHT_POLL_INTERVAL )
				).toBe( expected );
			}
		);

		it.each< [ unknown ] >( [
			[ undefined ],
			[ null ],
			[ '3' ],
			[ NaN ],
			[ Infinity ],
			[ -1 ],
		] )(
			'should wait for the fallback for a `retryAfter` of %p, which is no number of seconds the store can wait',
			( retryAfter ) => {
				expect(
					getRetryAfterDelay( retryAfter, AI_INSIGHT_RETRY_INTERVAL )
				).toBe( AI_INSIGHT_RETRY_INTERVAL );
				expect(
					getRetryAfterDelay( retryAfter, AI_INSIGHT_POLL_INTERVAL )
				).toBe( AI_INSIGHT_POLL_INTERVAL );
			}
		);
	} );

	describe( 'getAIInsightErrorCode', () => {
		it.each( Object.values( AI_INSIGHT_ERROR_CODES ) )(
			'should return the `reason` %s, whatever the status of the error',
			( code ) => {
				expect(
					getAIInsightErrorCode(
						createError( 503, { reason: code } )
					)
				).toBe( code );
				expect(
					getAIInsightErrorCode(
						createError( undefined, { reason: code } )
					)
				).toBe( code );
			}
		);

		it.each< [ number, AIInsightErrorCode ] >( [
			[ 400, AI_INSIGHT_ERROR_CODES.INVALID_ARGUMENT ],
			[ 401, AI_INSIGHT_ERROR_CODES.PERMISSION_DENIED ],
			[ 403, AI_INSIGHT_ERROR_CODES.PERMISSION_DENIED ],
			[ 404, AI_INSIGHT_ERROR_CODES.NOT_FOUND ],
			[ 409, AI_INSIGHT_ERROR_CODES.GENERATION_IN_PROGRESS ],
			[ 429, AI_INSIGHT_ERROR_CODES.RATE_LIMITED ],
			[ 500, AI_INSIGHT_ERROR_CODES.INTERNAL ],
			[ 503, AI_INSIGHT_ERROR_CODES.SERVICE_BUSY ],
		] )(
			'should read a %d without a code the store knows as `%s`',
			( status, expected ) => {
				expect( getAIInsightErrorCode( createError( status ) ) ).toBe(
					expected
				);
				// A code the service added later.
				expect(
					getAIInsightErrorCode(
						createError( status, { reason: 'A_NEW_CODE' } )
					)
				).toBe( expected );
			}
		);

		it.each< [ string, ErrorObject | undefined ] >( [
			[ 'no error', undefined ],
			[ 'an error without data, such as a network error', networkError ],
			[
				'a code the store does not know and no status',
				createError( undefined, { reason: 'A_NEW_CODE' } ),
			],
			[
				'a code in another case, such as `service_busy`',
				createError( undefined, { reason: 'service_busy' } ),
			],
			[
				'a status the service does not code, such as a 502',
				createError( 502 ),
			],
			[
				'a status that is not a number',
				{
					code: 'test_insight_error',
					message: 'The service refused the request.',
					data: { status: '503' },
				} as unknown as ErrorObject,
			],
		] )( 'should return `undefined` for %s', ( _, error ) => {
			expect( getAIInsightErrorCode( error ) ).toBeUndefined();
		} );
	} );

	describe( 'getFailureLifetime', () => {
		it.each< [ string, ErrorObject ] >( [
			[
				'a refusal for permissions (`PERMISSION_DENIED`)',
				createError( 403, { reason: 'PERMISSION_DENIED' } ),
			],
			[ 'a 403 without a code the store knows', createError( 403 ) ],
			[ 'a 401 without a code the store knows', createError( 401 ) ],
		] )( 'should keep %s for an hour', ( _, error ) => {
			expect( getFailureLifetime( error ) ).toBe( HOUR_IN_SECONDS );
		} );

		it.each(
			Object.values( AI_INSIGHT_ERROR_CODES ).filter(
				( code ) => code !== AI_INSIGHT_ERROR_CODES.PERMISSION_DENIED
			)
		)( 'should not keep a failure with the code %s', ( code ) => {
			expect(
				getFailureLifetime( createError( 500, { reason: code } ) )
			).toBeUndefined();
		} );

		it( 'should not keep a failure without a status, such as a network error', () => {
			expect( getFailureLifetime( networkError ) ).toBeUndefined();
		} );
	} );

	describe( 'getQuotaHoldLifetime', () => {
		it.each< [ string, string, unknown, number ] >( [
			[
				'the rate limit for 30 minutes, though its Retry-After is a minute',
				'RATE_LIMITED',
				60,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
			[
				'the rate limit without a Retry-After for 30 minutes',
				'RATE_LIMITED',
				undefined,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
			[
				'the rate limit with a Retry-After of 0 for 30 minutes',
				'RATE_LIMITED',
				0,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
			[
				'the rate limit for its Retry-After of 30 minutes',
				'RATE_LIMITED',
				AI_INSIGHT_RATE_LIMIT_HOLD,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
			[
				'the rate limit for longer when its Retry-After asks for it',
				'RATE_LIMITED',
				2 * HOUR_IN_SECONDS,
				2 * HOUR_IN_SECONDS,
			],
			[
				'the rate limit for whole seconds, rounded up',
				'RATE_LIMITED',
				AI_INSIGHT_RATE_LIMIT_HOLD + 0.2,
				AI_INSIGHT_RATE_LIMIT_HOLD + 1,
			],
			[
				'the rate limit for up to a day',
				'RATE_LIMITED',
				200000,
				DAY_IN_SECONDS,
			],
			[
				'a 429 with a code the store does not know as the rate limit',
				'A_NEW_CODE',
				60,
				AI_INSIGHT_RATE_LIMIT_HOLD,
			],
			[
				'the daily cap until its Retry-After',
				'DAILY_CAP',
				2 * HOUR_IN_SECONDS,
				2 * HOUR_IN_SECONDS,
			],
			[
				'the daily cap until its Retry-After, though that is under 30 minutes',
				'DAILY_CAP',
				600,
				600,
			],
			[
				'the daily cap for whole seconds, rounded up',
				'DAILY_CAP',
				599.5,
				600,
			],
			[
				'the daily cap for up to a day',
				'DAILY_CAP',
				200000,
				DAY_IN_SECONDS,
			],
			[
				'the daily cap without a Retry-After for an hour',
				'DAILY_CAP',
				undefined,
				HOUR_IN_SECONDS,
			],
			[
				'the daily cap with a Retry-After of 0 for an hour',
				'DAILY_CAP',
				0,
				HOUR_IN_SECONDS,
			],
			[
				'the daily cap with a negative Retry-After for an hour',
				'DAILY_CAP',
				-1,
				HOUR_IN_SECONDS,
			],
			[
				'the daily cap with a Retry-After that is not a number for an hour',
				'DAILY_CAP',
				'600',
				HOUR_IN_SECONDS,
			],
			[
				'the daily cap with a Retry-After that is not finite for an hour',
				'DAILY_CAP',
				Infinity,
				HOUR_IN_SECONDS,
			],
		] )(
			'should hold back a refusal for %s',
			( _, reason, retryAfter, expected ) => {
				expect(
					getQuotaHoldLifetime(
						createError( 429, { reason, retryAfter } )
					)
				).toBe( expected );
			}
		);
	} );

	describe( 'resolveAIInsight', () => {
		const runningOperation: AIInsightOperationResponse< TestInsight > = {
			done: false,
			state: 'RUNNING',
		};
		const succeededOperation: AIInsightOperationResponse< TestInsight > = {
			done: true,
			state: 'SUCCEEDED',
			insight,
		};

		const invalidResponseError = {
			code: 'invalid_test_insight_response',
			message: expect.any( String ),
			data: { status: 500 },
		};
		const timeoutError = {
			code: 'test_insight_timeout',
			message: expect.any( String ),
		};

		beforeEach( () => {
			// The store waits between the requests for the insight.
			jest.useFakeTimers();
		} );

		describe( 'with a cache entry', () => {
			it.each< [ string, AIInsightOutcome< TestInsight > ] >( [
				[ 'an insight', { insight } ],
				[ 'null for no insight to show', { insight: null } ],
				[
					'a failure',
					{
						error: createError( 403, {
							reason: 'PERMISSION_DENIED',
						} ),
					},
				],
			] )(
				'should return %s from the cache entry without a request',
				async ( _, entry ) => {
					await setItem( cacheKey, entry, { ttl: HOUR_IN_SECONDS } );

					const request = createRequest();

					expect( await resolveWithTimers( request ) ).toEqual(
						entry
					);
					expect( request.submit ).not.toHaveBeenCalled();
					expect( request.readOperation ).not.toHaveBeenCalled();
				}
			);

			it( 'should read the operation in the cache entry at once, rather than ask for the insight again', async () => {
				await setItem(
					cacheKey,
					{
						operationID: 'operation-1',
						createdAt: Date.now() - 5000,
					},
					{ ttl: HOUR_IN_SECONDS }
				);

				const request = createRequest();
				request.readOperation.mockResolvedValueOnce( {
					response: succeededOperation,
				} );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );
				expect( request.readOperation ).toHaveBeenCalledWith(
					'operation-1'
				);
				expect( await promise ).toEqual( { insight } );
				expect( request.submit ).not.toHaveBeenCalled();
			} );

			it.each< [ string, unknown ] >( [
				[
					'an insight that is not an object',
					{ insight: 'Your site had more visits than usual.' },
				],
				[
					'a failure that is not an object',
					{ error: 'The service refused the request.' },
				],
				[
					'an operation with an empty ID',
					{ operationID: '', createdAt: 1 },
				],
				[
					'an operation without the time it started',
					{ operationID: 'operation-1' },
				],
				[ 'a value that is not an object', 'operation-1' ],
				[ 'an empty object', {} ],
			] )(
				'should ask for the insight when the cache entry holds %s',
				async ( _, entry ) => {
					await setItem( cacheKey, entry, { ttl: HOUR_IN_SECONDS } );

					const request = createRequest();
					request.submit.mockResolvedValueOnce( {
						response: { insight },
					} );

					expect( await resolveWithTimers( request ) ).toEqual( {
						insight,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					expect( request.readOperation ).not.toHaveBeenCalled();
				}
			);

			it( 'should ask for the insight when the cache entry is not valid JSON', async () => {
				// The API cache keeps the entries of one tab in
				// `sessionStorage`.
				sessionStorage.setItem(
					`${ STORAGE_KEY_PREFIX }${ cacheKey }`,
					'{"timestamp":'
				);

				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					insight,
				} );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'should keep the entry for the current tab alone by default', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				await resolveWithTimers( request );

				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight },
					ttl: DAY_IN_SECONDS,
				} );
				expect(
					await getStoredItem( cacheKey, { shared: true } )
				).toBeUndefined();
			} );

			it( 'should keep the entry where every tab of the login session reads it when the request is `shared`', async () => {
				const request = createRequest( { shared: true } );
				request.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				await resolveWithTimers( request );

				expect(
					await getStoredItem( cacheKey, { shared: true } )
				).toEqual( {
					value: { insight },
					ttl: DAY_IN_SECONDS,
				} );
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();

				// A new tab has a `sessionStorage` of its own, and shares
				// `localStorage`.
				sessionStorage.clear();

				const nextRequest = createRequest( { shared: true } );

				expect( await resolveWithTimers( nextRequest ) ).toEqual( {
					insight,
				} );
				expect( nextRequest.submit ).not.toHaveBeenCalled();
			} );

			it( 'should delete the operation from the entry that every tab shares when the request is `shared`', async () => {
				const request = createRequest( { shared: true } );
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValueOnce( {
					error: createError(
						500,
						{ reason: 'MODEL_UNAVAILABLE' },
						'test_insight_failed'
					),
				} );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				expect(
					await getStoredItem( cacheKey, { shared: true } )
				).toMatchObject( { value: { operationID: 'operation-1' } } );

				await jest.runAllTimersAsync();
				await promise;

				expect(
					await getStoredItem( cacheKey, { shared: true } )
				).toBeUndefined();
			} );

			it( 'should neither read nor write the cache entry while the API cache is off', async () => {
				await setItem(
					cacheKey,
					{ insight: otherInsight },
					{ ttl: DAY_IN_SECONDS }
				);

				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValueOnce( {
					response: succeededOperation,
				} );

				setUsingCache( false );

				try {
					expect( await resolveWithTimers( request ) ).toEqual( {
						insight,
					} );
				} finally {
					setUsingCache( true );
				}

				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight: otherInsight },
					ttl: DAY_IN_SECONDS,
				} );
			} );
		} );

		describe( 'when the service answers at once', () => {
			it( 'should return the insight the service already had, with one request, and keep it for a day', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					insight,
				} );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( request.readOperation ).not.toHaveBeenCalled();
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight },
					ttl: DAY_IN_SECONDS,
				} );
			} );

			it( 'should return null, and keep it for a day, when the service has no insight to show', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { insight: null },
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					insight: null,
				} );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight: null },
					ttl: DAY_IN_SECONDS,
				} );
			} );

			it( 'should return null without an error, and keep it for a day, when the service has no visits to describe (`NO_DATA`)', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					error: createError( 400, { reason: 'NO_DATA' } ),
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					insight: null,
				} );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight: null },
					ttl: DAY_IN_SECONDS,
				} );
			} );

			it.each< [ string, SubmitResult ] >( [
				[ 'neither an insight nor an operation', { response: {} } ],
				[ 'no answer at all', {} ],
				[
					'an insight that is not an object',
					{
						response: {
							insight: 'Your site had more visits than usual.',
						},
					} as unknown as SubmitResult,
				],
				[
					'an operation with an empty ID',
					{ response: { operationID: '' } },
				],
			] )(
				'should give up with the `invalidResponseErrorCode` when the service answers with %s',
				async ( _, result ) => {
					const request = createRequest();
					request.submit.mockResolvedValueOnce( result );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error: invalidResponseError,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					expect( request.readOperation ).not.toHaveBeenCalled();
				}
			);
		} );

		describe( 'when the service generates the insight', () => {
			it( 'should keep the operation in the cache entry for an hour while it runs', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValue( {
					response: succeededOperation,
				} );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( request.readOperation ).not.toHaveBeenCalled();
				// A reload reads the operation rather than asking for the
				// insight again.
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: {
						operationID: 'operation-1',
						createdAt: Date.now(),
					},
					ttl: HOUR_IN_SECONDS,
				} );

				await jest.runAllTimersAsync();
				await promise;
			} );

			it( 'should read the operation every two seconds until it is done, and keep its insight for a day in place of the operation', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation
					.mockResolvedValueOnce( { response: runningOperation } )
					.mockResolvedValueOnce( { response: succeededOperation } );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync(
					AI_INSIGHT_POLL_INTERVAL - 1
				);

				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( request.readOperation ).not.toHaveBeenCalled();

				await jest.advanceTimersByTimeAsync( 1 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );
				expect( request.readOperation ).toHaveBeenCalledWith(
					'operation-1'
				);

				await jest.advanceTimersByTimeAsync(
					AI_INSIGHT_POLL_INTERVAL - 1
				);

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 2 );
				expect( await promise ).toEqual( { insight } );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight },
					ttl: DAY_IN_SECONDS,
				} );
			} );

			it.each< [ string, number | undefined, number ] >( [
				[
					'after the `retryAfter` of the answer that returned it',
					3,
					3000,
				],
				[
					'a second after an answer with a `retryAfter` of 0, and never sooner',
					0,
					1000,
				],
				[
					'two seconds after an answer without a `retryAfter`',
					undefined,
					AI_INSIGHT_POLL_INTERVAL,
				],
			] )(
				'should read the operation for the first time %s',
				async ( _, retryAfter, delay ) => {
					const request = createRequest();
					request.submit.mockResolvedValueOnce( {
						response: { operationID: 'operation-1', retryAfter },
					} );
					request.readOperation.mockResolvedValueOnce( {
						response: succeededOperation,
					} );

					const promise = resolveAIInsight( request );

					await jest.advanceTimersByTimeAsync( delay - 1 );

					expect( request.readOperation ).not.toHaveBeenCalled();

					await jest.advanceTimersByTimeAsync( 1 );

					expect( request.readOperation ).toHaveBeenCalledTimes( 1 );
					expect( await promise ).toEqual( { insight } );
				}
			);

			it( 'should read the operation again after the `retryAfter` of each read, or two seconds after a read without one', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1', retryAfter: 1 },
				} );
				request.readOperation
					.mockResolvedValueOnce( {
						response: { ...runningOperation, retryAfter: 4 },
					} )
					.mockResolvedValueOnce( { response: runningOperation } )
					.mockResolvedValueOnce( { response: succeededOperation } );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 1000 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );

				await jest.advanceTimersByTimeAsync( 3999 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 2 );

				await jest.advanceTimersByTimeAsync(
					AI_INSIGHT_POLL_INTERVAL - 1
				);

				expect( request.readOperation ).toHaveBeenCalledTimes( 2 );

				await jest.advanceTimersByTimeAsync( 1 );

				expect( request.readOperation ).toHaveBeenCalledTimes( 3 );
				expect( await promise ).toEqual( { insight } );
			} );

			it( 'should return null, and keep it for a day, when the operation is done with no insight to show', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValueOnce( {
					response: { done: true, state: 'SUCCEEDED', insight: null },
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					insight: null,
				} );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { insight: null },
					ttl: DAY_IN_SECONDS,
				} );
			} );

			it.each< [ string, ReadResult ] >( [
				[
					'no insight',
					{ response: { done: true, state: 'SUCCEEDED' } },
				],
				[
					'an insight that is not an object',
					{
						response: {
							done: true,
							state: 'SUCCEEDED',
							insight: 'Your site had more visits than usual.',
						},
					} as unknown as ReadResult,
				],
			] )(
				'should give up with the `invalidResponseErrorCode`, and delete the operation, when the operation is done with %s',
				async ( _, result ) => {
					const request = createRequest();
					request.submit.mockResolvedValueOnce( {
						response: { operationID: 'operation-1' },
					} );
					request.readOperation.mockResolvedValueOnce( result );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error: invalidResponseError,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					// The next load asks for the insight again.
					expect( await getStoredItem( cacheKey ) ).toBeUndefined();
				}
			);
		} );

		describe( 'when the service is busy', () => {
			it.each< [ string, number, string | undefined ] >( [
				[
					'a 409 (`GENERATION_IN_PROGRESS`)',
					409,
					'GENERATION_IN_PROGRESS',
				],
				[ 'a 503 (`SERVICE_BUSY`)', 503, 'SERVICE_BUSY' ],
				[
					'a 409 with a code the store does not know',
					409,
					'A_NEW_CODE',
				],
				[ 'a 503 without a code', 503, undefined ],
			] )(
				'should ask for the insight again after the `retryAfter` of %s',
				async ( _, status, reason ) => {
					const request = createRequest();
					request.submit
						.mockResolvedValueOnce( {
							error: createError( status, {
								reason,
								retryAfter: 3,
							} ),
						} )
						.mockResolvedValueOnce( { response: { insight } } );

					const promise = resolveAIInsight( request );

					await jest.advanceTimersByTimeAsync( 2999 );

					expect( request.submit ).toHaveBeenCalledTimes( 1 );

					await jest.advanceTimersByTimeAsync( 1 );

					expect( request.submit ).toHaveBeenCalledTimes( 2 );
					expect( await promise ).toEqual( { insight } );
				}
			);

			it.each< [ number, string ] >( [
				[ 409, 'GENERATION_IN_PROGRESS' ],
				[ 503, 'SERVICE_BUSY' ],
			] )(
				'should ask for the insight again five seconds after a %d without a `retryAfter`',
				async ( status, reason ) => {
					const request = createRequest();
					request.submit
						.mockResolvedValueOnce( {
							error: createError( status, { reason } ),
						} )
						.mockResolvedValueOnce( { response: { insight } } );

					const promise = resolveAIInsight( request );

					await jest.advanceTimersByTimeAsync(
						AI_INSIGHT_RETRY_INTERVAL - 1
					);

					expect( request.submit ).toHaveBeenCalledTimes( 1 );

					await jest.advanceTimersByTimeAsync( 1 );

					expect( request.submit ).toHaveBeenCalledTimes( 2 );
					expect( await promise ).toEqual( { insight } );
				}
			);

			it( 'should stop asking at the deadline, and give up with the refusal, while the service keeps refusing the request', async () => {
				const refusal = createError( 503, {
					reason: 'SERVICE_BUSY',
					retryAfter: AI_INSIGHT_RETRY_INTERVAL / 1000,
				} );

				const request = createRequest();
				request.submit.mockResolvedValue( { error: refusal } );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: refusal,
				} );
				// The store asks every five seconds, and gives up rather than
				// start a wait that ends at the deadline.
				expect( request.submit ).toHaveBeenCalledTimes(
					AI_INSIGHT_DEADLINE / AI_INSIGHT_RETRY_INTERVAL
				);
				expect( request.readOperation ).not.toHaveBeenCalled();
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();
			} );

			it( 'should give up at once with a refusal whose `retryAfter` ends at the deadline', async () => {
				const refusal = createError( 503, {
					reason: 'SERVICE_BUSY',
					retryAfter: AI_INSIGHT_DEADLINE / 1000,
				} );

				const request = createRequest();
				request.submit.mockResolvedValue( { error: refusal } );

				let outcome: AIInsightOutcome< TestInsight > | undefined;
				resolveAIInsight( request ).then( ( value ) => {
					outcome = value;
				} );

				await jest.advanceTimersByTimeAsync( 0 );

				expect( outcome ).toEqual( { error: refusal } );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'should give up with the refusal when the device sleeps through the wait past the deadline', async () => {
				const refusal = createError( 503, {
					reason: 'SERVICE_BUSY',
					retryAfter: 1,
				} );

				const request = createRequest();
				request.submit
					.mockResolvedValueOnce( { error: refusal } )
					.mockResolvedValueOnce( { response: { insight } } );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				// The clock passes the deadline during the wait, as for a
				// device that wakes up.
				jest.setSystemTime( Date.now() + AI_INSIGHT_DEADLINE );

				await jest.advanceTimersByTimeAsync( 1000 );

				expect( await promise ).toEqual( { error: refusal } );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
			} );

			it.each< [ string, ErrorObject ] >( [
				[
					'a malformed request (`INVALID_ARGUMENT`)',
					createError( 400, { reason: 'INVALID_ARGUMENT' } ),
				],
				[
					'a site the service has no record of (`SITE_NOT_FOUND`)',
					createError( 400, { reason: 'SITE_NOT_FOUND' } ),
				],
				[
					'a failed generation (`MODEL_UNAVAILABLE`), though it has a 503 and a `retryAfter`',
					createError( 503, {
						reason: 'MODEL_UNAVAILABLE',
						retryAfter: 1,
					} ),
				],
				[ 'a network error', networkError ],
			] )(
				'should give up with %s without asking again',
				async ( _, error ) => {
					const request = createRequest();
					request.submit.mockResolvedValue( { error } );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					expect( request.readOperation ).not.toHaveBeenCalled();
				}
			);
		} );

		describe( 'when an operation is lost', () => {
			it.each< [ string, ErrorObject ] >( [
				[
					'has expired (`NOT_FOUND`)',
					createError( 404, { reason: 'NOT_FOUND' } ),
				],
				[ 'is unknown, by its 404', createError( 404 ) ],
				[
					'was interrupted (`SERVICE_BUSY`)',
					createError(
						503,
						{ reason: 'SERVICE_BUSY' },
						'test_insight_failed'
					),
				],
			] )(
				'should ask for the insight again, once, when the operation %s',
				async ( _, error ) => {
					const request = createRequest();
					request.submit
						.mockResolvedValueOnce( {
							response: { operationID: 'operation-1' },
						} )
						.mockResolvedValueOnce( {
							response: { operationID: 'operation-2' },
						} );
					request.readOperation
						.mockResolvedValueOnce( { error } )
						.mockResolvedValueOnce( {
							response: succeededOperation,
						} );

					expect( await resolveWithTimers( request ) ).toEqual( {
						insight,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 2 );
					expect( request.readOperation.mock.calls ).toEqual( [
						[ 'operation-1' ],
						[ 'operation-2' ],
					] );
				}
			);

			it( 'should give up with the error of the read, and delete the operation, when a second operation is lost too', async () => {
				const notFound = createError( 404, { reason: 'NOT_FOUND' } );

				const request = createRequest();
				request.submit
					.mockResolvedValueOnce( {
						response: { operationID: 'operation-1' },
					} )
					.mockResolvedValueOnce( {
						response: { operationID: 'operation-2' },
					} );
				request.readOperation.mockResolvedValue( { error: notFound } );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: notFound,
				} );
				expect( request.submit ).toHaveBeenCalledTimes( 2 );
				expect( request.readOperation.mock.calls ).toEqual( [
					[ 'operation-1' ],
					[ 'operation-2' ],
				] );
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();
			} );

			it( 'should delete the operation, and ask for the insight again, once the operation has run for `AI_INSIGHT_OPERATION_LIFETIME`', async () => {
				await setItem(
					cacheKey,
					{
						operationID: 'operation-1',
						createdAt:
							Date.now() -
							AI_INSIGHT_OPERATION_LIFETIME +
							AI_INSIGHT_POLL_INTERVAL,
					},
					{ ttl: HOUR_IN_SECONDS }
				);

				const pendingSubmit: {
					answer?: ( result: SubmitResult ) => void;
				} = {};

				const request = createRequest();
				request.readOperation.mockResolvedValue( {
					response: runningOperation,
				} );
				// The new request waits, so the test can read the entry in
				// between.
				request.submit.mockReturnValueOnce(
					new Promise( ( resolve ) => {
						pendingSubmit.answer = resolve;
					} )
				);

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				// The operation is younger than its lifetime at the first read.
				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );
				expect( request.submit ).not.toHaveBeenCalled();

				await jest.advanceTimersByTimeAsync( AI_INSIGHT_POLL_INTERVAL );

				expect( request.readOperation ).toHaveBeenCalledTimes( 2 );
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();

				pendingSubmit.answer?.( { response: { insight } } );

				expect( await promise ).toEqual( { insight } );
				expect( request.readOperation ).toHaveBeenCalledTimes( 2 );
			} );
		} );

		describe( 'when a read of the operation fails', () => {
			it.each< [ string, ErrorObject ] >( [
				[
					'the `failedErrorCode` of a failed generation',
					createError(
						500,
						{ reason: 'MODEL_UNAVAILABLE' },
						'test_insight_failed'
					),
				],
				[
					'a malformed request (`INVALID_ARGUMENT`)',
					createError( 400, { reason: 'INVALID_ARGUMENT' } ),
				],
				[
					'a refusal for permissions (`PERMISSION_DENIED`)',
					createError( 403, { reason: 'PERMISSION_DENIED' } ),
				],
			] )(
				'should delete the operation from the cache entry when the read fails with %s',
				async ( _, error ) => {
					// The request keeps no failure, so the entry shows what the
					// failed read left of the operation.
					const request = createRequest( {
						getFailureLifetime: () => undefined,
					} );
					request.submit.mockResolvedValueOnce( {
						response: { operationID: 'operation-1' },
					} );
					request.readOperation.mockResolvedValueOnce( { error } );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					expect( await getStoredItem( cacheKey ) ).toBeUndefined();
				}
			);

			it.each< [ string, ErrorObject ] >( [
				[ 'no status, such as a network error', networkError ],
				[
					'a 500 that is not a failed generation',
					createError( 500, { reason: 'INTERNAL' } ),
				],
				[
					'a 504, such as a read that ran past the time limit',
					createError( 504 ),
				],
			] )(
				'should keep the operation in the cache entry for the next load when the read fails with %s',
				async ( _, error ) => {
					const startedAt = Date.now();

					const request = createRequest( {
						getFailureLifetime: () => undefined,
					} );
					request.submit.mockResolvedValueOnce( {
						response: { operationID: 'operation-1' },
					} );
					request.readOperation.mockResolvedValueOnce( { error } );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					expect( await getStoredItem( cacheKey ) ).toEqual( {
						value: {
							operationID: 'operation-1',
							createdAt: startedAt,
						},
						ttl: HOUR_IN_SECONDS,
					} );
				}
			);
		} );

		describe( 'at the deadline', () => {
			it( 'should give up with the `timeoutErrorCode`, and keep the operation in the cache entry for the next load', async () => {
				const startedAt = Date.now();

				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValue( {
					response: runningOperation,
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: timeoutError,
				} );
				// The store reads the operation every two seconds, and gives up
				// rather than start a wait that ends at the deadline.
				expect( request.readOperation ).toHaveBeenCalledTimes(
					AI_INSIGHT_DEADLINE / AI_INSIGHT_POLL_INTERVAL - 1
				);
				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { operationID: 'operation-1', createdAt: startedAt },
					ttl: HOUR_IN_SECONDS,
				} );
			} );

			it( 'should give up at once after a read whose `retryAfter` ends at the deadline', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValueOnce( {
					response: {
						...runningOperation,
						retryAfter:
							( AI_INSIGHT_DEADLINE - AI_INSIGHT_POLL_INTERVAL ) /
							1000,
					},
				} );

				let outcome: AIInsightOutcome< TestInsight > | undefined;
				resolveAIInsight( request ).then( ( value ) => {
					outcome = value;
				} );

				await jest.advanceTimersByTimeAsync( AI_INSIGHT_POLL_INTERVAL );

				expect( request.readOperation ).toHaveBeenCalledTimes( 1 );
				expect( outcome ).toEqual( { error: timeoutError } );
			} );

			it( 'should give up when the device sleeps through the wait before a read past the deadline', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValue( {
					response: succeededOperation,
				} );

				const promise = resolveAIInsight( request );

				await jest.advanceTimersByTimeAsync( 0 );

				// The clock passes the deadline during the wait, as for a
				// device that wakes up.
				jest.setSystemTime( Date.now() + AI_INSIGHT_DEADLINE );

				await jest.advanceTimersByTimeAsync( AI_INSIGHT_POLL_INTERVAL );

				expect( await promise ).toEqual( { error: timeoutError } );
				expect( request.readOperation ).not.toHaveBeenCalled();
				expect( await getStoredItem( cacheKey ) ).toMatchObject( {
					value: { operationID: 'operation-1' },
				} );
			} );
		} );

		describe( 'when the insight fails', () => {
			it( 'should keep a refusal for permissions for an hour, by `getFailureLifetime()`', async () => {
				const refusal = createError( 403, {
					reason: 'PERMISSION_DENIED',
				} );

				const request = createRequest();
				request.submit.mockResolvedValueOnce( { error: refusal } );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: refusal,
				} );
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { error: refusal },
					ttl: HOUR_IN_SECONDS,
				} );
			} );

			it( 'should keep no other failure, by `getFailureLifetime()`, so the next load asks again', async () => {
				const failure = createError( 500, { reason: 'INTERNAL' } );

				const request = createRequest();
				request.submit.mockResolvedValueOnce( { error: failure } );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: failure,
				} );
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();
			} );

			it( 'should keep a failure, in place of the operation, for as long as the `getFailureLifetime` of the request says', async () => {
				const failure = createError(
					500,
					{ reason: 'MODEL_OUTPUT_INVALID' },
					'test_insight_failed'
				);
				const requestFailureLifetime = jest
					.fn< number | undefined, [ ErrorObject ] >()
					.mockReturnValue( 300 );

				const request = createRequest( {
					getFailureLifetime: requestFailureLifetime,
				} );
				request.submit.mockResolvedValueOnce( {
					response: { operationID: 'operation-1' },
				} );
				request.readOperation.mockResolvedValueOnce( {
					error: failure,
				} );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: failure,
				} );
				expect( requestFailureLifetime ).toHaveBeenCalledWith(
					failure
				);
				expect( await getStoredItem( cacheKey ) ).toEqual( {
					value: { error: failure },
					ttl: 300,
				} );
			} );

			it( 'should keep no failure that the `getFailureLifetime` of the request does not keep, though `getFailureLifetime()` would', async () => {
				const refusal = createError( 403, {
					reason: 'PERMISSION_DENIED',
				} );

				const request = createRequest( {
					getFailureLifetime: () => undefined,
				} );
				request.submit.mockResolvedValueOnce( { error: refusal } );

				expect( await resolveWithTimers( request ) ).toEqual( {
					error: refusal,
				} );
				expect( await getStoredItem( cacheKey ) ).toBeUndefined();
			} );
		} );

		describe( 'with a refusal for the quota', () => {
			it.each< [ string, string, number, number ] >( [
				[
					'the rate limit (`RATE_LIMITED`)',
					'RATE_LIMITED',
					60,
					AI_INSIGHT_RATE_LIMIT_HOLD,
				],
				[
					'the daily cap (`DAILY_CAP`)',
					'DAILY_CAP',
					2 * HOUR_IN_SECONDS,
					2 * HOUR_IN_SECONDS,
				],
				[
					'a 429 with a code the store does not know',
					'A_NEW_CODE',
					60,
					AI_INSIGHT_RATE_LIMIT_HOLD,
				],
			] )(
				'should hold back the requests for every insight after a refusal for %s',
				async ( _, reason, retryAfter, lifetime ) => {
					const refusal = createError( 429, { reason, retryAfter } );

					const request = createRequest();
					request.submit.mockResolvedValueOnce( { error: refusal } );

					expect( await resolveWithTimers( request ) ).toEqual( {
						error: refusal,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
					// Every tab shares the hold, for as long as
					// `getQuotaHoldLifetime()` says.
					expect(
						await getStoredItem( quotaHoldCacheKey, {
							shared: true,
						} )
					).toEqual( { value: { error: refusal }, ttl: lifetime } );
					// The refusal isn't kept for its request alone.
					expect( await getStoredItem( cacheKey ) ).toBeUndefined();

					// The quota counts the generations of every insight, so
					// another insight waits too.
					const otherRequest = createRequest( {
						cacheKey: otherCacheKey,
					} );

					expect( await resolveWithTimers( otherRequest ) ).toEqual( {
						error: refusal,
					} );
					expect( otherRequest.submit ).not.toHaveBeenCalled();
				}
			);

			it( 'should ask for the insight again once the hold has passed', async () => {
				const refusal = createError( 429, {
					reason: 'RATE_LIMITED',
					retryAfter: 60,
				} );

				const request = createRequest();
				request.submit.mockResolvedValueOnce( { error: refusal } );

				await resolveWithTimers( request );

				// The API cache counts in whole seconds.
				jest.setSystemTime(
					Date.now() + AI_INSIGHT_RATE_LIMIT_HOLD * 1000 - 1000
				);

				const heldRequest = createRequest( {
					cacheKey: otherCacheKey,
				} );

				expect( await resolveWithTimers( heldRequest ) ).toEqual( {
					error: refusal,
				} );
				expect( heldRequest.submit ).not.toHaveBeenCalled();

				jest.setSystemTime( Date.now() + 1000 );

				const laterRequest = createRequest( {
					cacheKey: otherCacheKey,
				} );
				laterRequest.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				expect( await resolveWithTimers( laterRequest ) ).toEqual( {
					insight,
				} );
				expect( laterRequest.submit ).toHaveBeenCalledTimes( 1 );
			} );

			it( 'should not hold back the requests after a refusal of another kind', async () => {
				const request = createRequest();
				request.submit.mockResolvedValueOnce( {
					error: createError( 403, { reason: 'PERMISSION_DENIED' } ),
				} );

				await resolveWithTimers( request );

				expect(
					await getStoredItem( quotaHoldCacheKey, { shared: true } )
				).toBeUndefined();

				const otherRequest = createRequest( {
					cacheKey: otherCacheKey,
				} );
				otherRequest.submit.mockResolvedValueOnce( {
					response: { insight },
				} );

				expect( await resolveWithTimers( otherRequest ) ).toEqual( {
					insight,
				} );
			} );

			it.each< [ string, unknown ] >( [
				[
					'a refusal that is not an object',
					{ error: 'The quota is spent.' },
				],
				[ 'no refusal', {} ],
				[ 'a value that is not an object', 'RATE_LIMITED' ],
			] )(
				'should ask for the insight when the hold has %s',
				async ( _, value ) => {
					await setItem( quotaHoldCacheKey, value, {
						ttl: HOUR_IN_SECONDS,
						shared: true,
					} );

					const request = createRequest();
					request.submit.mockResolvedValueOnce( {
						response: { insight },
					} );

					expect( await resolveWithTimers( request ) ).toEqual( {
						insight,
					} );
					expect( request.submit ).toHaveBeenCalledTimes( 1 );
				}
			);

			it( 'should neither read nor write the hold while the API cache is off', async () => {
				const heldRefusal = createError( 429, {
					reason: 'DAILY_CAP',
					retryAfter: 2 * HOUR_IN_SECONDS,
				} );
				const newRefusal = createError( 429, {
					reason: 'RATE_LIMITED',
					retryAfter: 60,
				} );

				await setItem(
					quotaHoldCacheKey,
					{ error: heldRefusal },
					{ ttl: 2 * HOUR_IN_SECONDS, shared: true }
				);

				const request = createRequest();
				request.submit.mockResolvedValueOnce( { error: newRefusal } );

				setUsingCache( false );

				try {
					expect( await resolveWithTimers( request ) ).toEqual( {
						error: newRefusal,
					} );
				} finally {
					setUsingCache( true );
				}

				expect( request.submit ).toHaveBeenCalledTimes( 1 );
				expect(
					await getStoredItem( quotaHoldCacheKey, { shared: true } )
				).toEqual( {
					value: { error: heldRefusal },
					ttl: 2 * HOUR_IN_SECONDS,
				} );
			} );
		} );
	} );
} );
