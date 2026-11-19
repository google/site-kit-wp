/**
 * `modules/analytics-4` data store: shared waiting logic of the generated insights.
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
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usingCache } from 'googlesitekit-api';
import { deleteItem, getItem, setItem } from '@/js/googlesitekit/api/cache';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';

/**
 * The longest the store waits for an insight, in milliseconds.
 *
 * The service stops a generation that runs longer than its worker allows,
 * which is 60 seconds. A wait that gives up still leaves the generation
 * running, and the service keeps its result for the next request.
 *
 * @since n.e.x.t
 */
export const AI_INSIGHT_DEADLINE = 60 * 1000;

/**
 * The time the store waits before it reads the operation that generates an
 * insight, in milliseconds, when the service's answer doesn't say how long to
 * wait. It is the `Retry-After` the service sends with an operation that runs.
 *
 * @since n.e.x.t
 */
export const AI_INSIGHT_POLL_INTERVAL = 2 * 1000;

/**
 * The time before the store asks again for an insight that the service
 * turned away for being busy, in milliseconds, when the refusal doesn't say
 * how long to wait. It is the `Retry-After` the service sends with a 409 or a
 * 503.
 *
 * @since n.e.x.t
 */
export const AI_INSIGHT_RETRY_INTERVAL = 5 * 1000;

/**
 * The shortest time the store waits before its next request, in
 * milliseconds, whatever `Retry-After` the service sends. The service never
 * asks for less than a second, and a `Retry-After` of 0 must not make the
 * store send requests back to back.
 *
 * @since n.e.x.t
 */
const AI_INSIGHT_MIN_WAIT = 1000;

/**
 * The age at which an operation that still runs is taken for lost, in
 * milliseconds: the longest the service's client contract tells a client to
 * read an operation.
 *
 * @since n.e.x.t
 */
export const AI_INSIGHT_OPERATION_LIFETIME = 2 * 60 * 1000;

/**
 * The statuses of a refused request for an insight that the store sends
 * again after the refusal's `Retry-After`: the service was setting up an
 * identical request (409), or had no capacity for a new one (503). Neither
 * counts against the service's rate limit.
 *
 * @since n.e.x.t
 */
const RETRIED_SUBMIT_STATUSES = [ 409, 503 ];

/**
 * The statuses of a failed read of an operation after which the store asks for
 * the insight again, once: the operation has expired (404), or its instance
 * stopped before it finished (503).
 *
 * @since n.e.x.t
 */
const RESUBMITTED_OPERATION_STATUSES = [ 404, 503 ];

/**
 * The answer to a request for an insight.
 *
 * @since n.e.x.t
 */
export interface AIInsightSubmitResponse< Insight > {
	/** The ID of the operation that generates the insight, when the service has to generate it. */
	operationID?: string;
	/** The seconds to wait before the first read of the operation, when the service said: its `Retry-After`. */
	retryAfter?: number;
	/** The insight, when the service already had it, or null when there is none to show. */
	insight?: Insight | null;
}

/**
 * The answer to a read of the operation that generates an insight.
 *
 * @since n.e.x.t
 */
export interface AIInsightOperationResponse< Insight > {
	/** Whether the operation has finished. */
	done: boolean;
	/** `RUNNING` until the operation has finished, then `SUCCEEDED`. A failed operation is an error. */
	state: 'RUNNING' | 'SUCCEEDED';
	/** The seconds to wait before the next read of an operation that runs, when the service said: its `Retry-After`. */
	retryAfter?: number;
	/** The insight once the operation has succeeded, or null when there is none to show. */
	insight?: Insight | null;
}

/**
 * The result of a fetch store action.
 *
 * @since n.e.x.t
 */
export interface AIInsightFetchResult< Response > {
	response?: Response;
	error?: ErrorObject;
}

/**
 * What the store ends up with: the insight, which is null when there is none
 * to show, or the error that stopped it.
 *
 * @since n.e.x.t
 */
export type AIInsightOutcome< Insight > =
	| { insight: Insight | null }
	| { error: ErrorObject };

/**
 * The requests and the cache entry of one insight.
 *
 * @since n.e.x.t
 */
export interface AIInsightRequest< Insight > {
	/** Sends the request for the insight, with the fetch store action of the datapoint's `POST`. */
	submit: () => Promise<
		AIInsightFetchResult< AIInsightSubmitResponse< Insight > >
	>;
	/** Reads an operation, with the fetch store action of the datapoint's `GET`. */
	readOperation: (
		operationID: string
	) => Promise<
		AIInsightFetchResult< AIInsightOperationResponse< Insight > >
	>;
	/** The key of the entry the store keeps for the insight in the storage of the API cache. */
	cacheKey: string;
	/** The code of the error for an answer the store can't read, such as `invalid_conversion_insight_response`. */
	invalidResponseErrorCode: string;
	/** The code of the error for a passed deadline, such as `conversion_insight_timeout`. */
	timeoutErrorCode: string;
	/** The code of the error the datapoint answers with for a failed generation, such as `conversion_insight_failed`. */
	failedErrorCode: string;
}

interface PendingOperation {
	/** The ID of the operation that generates the insight. */
	operationID: string;
	/** The time the service returned the operation, in milliseconds since the Unix epoch. */
	createdAt: number;
}

/**
 * The entry the store keeps for an insight in the storage of the API cache:
 * the insight, a failure that the service would only repeat, or the operation
 * that generates the insight.
 */
type InsightCacheEntry< Insight > =
	| AIInsightOutcome< Insight >
	| PendingOperation;

/**
 * The step after a request: an outcome, or an operation to read after
 * `delay` milliseconds.
 */
type SubmitStep< Insight > =
	| AIInsightOutcome< Insight >
	| { operation: PendingOperation; delay: number };

/**
 * The step after a read of an operation: an outcome, a new request for the
 * insight, or another read after `delay` milliseconds.
 */
type ReadStep< Insight > =
	| AIInsightOutcome< Insight >
	| { resubmit: true }
	| { pending: true; delay: number };

/**
 * Gets the current time.
 *
 * The waits measure the time that has passed, so they read the clock rather
 * than the reference date that reports use.
 *
 * @since n.e.x.t
 *
 * @return {number} The current time, in milliseconds since the Unix epoch.
 */
function getCurrentTime(): number {
	// eslint-disable-next-line sitekit/no-direct-date -- The waits measure elapsed time, not a reporting period.
	return Date.now();
}

/**
 * Waits for a time.
 *
 * @since n.e.x.t
 *
 * @param {number} milliseconds The time to wait, in milliseconds.
 * @return {Promise} A promise that resolves once the time has passed.
 */
function sleep( milliseconds: number ): Promise< void > {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, milliseconds );
	} );
}

/**
 * Gets how long to wait before the next request to the service, from the
 * `retryAfter` of a datapoint's answer or error: the `Retry-After` header the
 * service sent, in seconds.
 *
 * A `retryAfter` that isn't a number of seconds the store can wait gives the
 * fallback, and the store never waits less than `AI_INSIGHT_MIN_WAIT`.
 *
 * @since n.e.x.t
 *
 * @param {*}      retryAfter The `retryAfter` of the answer or the error, if it has one.
 * @param {number} fallback   The time to wait without a usable `retryAfter`, in milliseconds.
 * @return {number} The time to wait, in milliseconds.
 */
export function getRetryAfterDelay(
	retryAfter: unknown,
	fallback: number
): number {
	if (
		typeof retryAfter !== 'number' ||
		! Number.isFinite( retryAfter ) ||
		retryAfter < 0
	) {
		return fallback;
	}

	return Math.max( AI_INSIGHT_MIN_WAIT, retryAfter * 1000 );
}

/**
 * Gets the status of a failed request.
 *
 * @since n.e.x.t
 *
 * @param {Object} error The error of the request.
 * @return {(number|undefined)} The status, or `undefined` when the error has none, as a network error doesn't.
 */
function getErrorStatus( error: ErrorObject ): number | undefined {
	const status = error.data?.status;

	return typeof status === 'number' ? status : undefined;
}

/**
 * Gets the error the store gives up with when the service returns no
 * insight it can read.
 *
 * @since n.e.x.t
 *
 * @param {string} code The code of the error.
 * @return {Object} The error.
 */
function getInvalidResponseError( code: string ): ErrorObject {
	return {
		code,
		message: __(
			'Site Kit received a generated insight it can’t read.',
			'google-site-kit'
		),
		data: { status: 500 },
	};
}

/**
 * Gets the error the store gives up with when the insight takes longer than
 * `AI_INSIGHT_DEADLINE`.
 *
 * @since n.e.x.t
 *
 * @param {string} code The code of the error.
 * @return {Object} The error.
 */
function getTimeoutError( code: string ): ErrorObject {
	return {
		code,
		message: __(
			'The generated insight took too long to arrive.',
			'google-site-kit'
		),
	};
}

/**
 * Checks whether a value is an insight, or null for no insight.
 *
 * @since n.e.x.t
 *
 * @param {*} value The value.
 * @return {boolean} Whether the value is an object or null.
 */
function isInsightOrNull( value: unknown ): boolean {
	return value === null || isPlainObject( value );
}

/**
 * Gets how long the store keeps a failure, so the widget doesn't ask again on
 * every load for an insight that the service would refuse.
 *
 * A refusal for the rate limit (429) is kept for at least an hour, in which
 * the user's own allowance accepts a request again, and for as long as the
 * service's `Retry-After` asks, such as until the daily cap resets, up to a
 * day. A refusal for permissions (403) is kept for an hour. Any other failure
 * isn't kept, so the next load asks again.
 *
 * @since n.e.x.t
 *
 * @param {Object} error The error of the request.
 * @return {(number|undefined)} The time to keep the failure, in seconds, or `undefined` when it isn't kept.
 */
function getFailureLifetime( error: ErrorObject ): number | undefined {
	const status = getErrorStatus( error );

	if ( status === 403 ) {
		return HOUR_IN_SECONDS;
	}

	if ( status === 429 ) {
		const retryAfter = Number( error.data?.retryAfter );

		return Math.min(
			DAY_IN_SECONDS,
			Math.max(
				HOUR_IN_SECONDS,
				Number.isFinite( retryAfter ) ? retryAfter : 0
			)
		);
	}

	return undefined;
}

/**
 * Reads the entry the store keeps for an insight.
 *
 * @since n.e.x.t
 *
 * @param {string} key The key of the entry.
 * @return {Promise<(Object|undefined)>} The entry, or `undefined` when there is none, it has expired, it can't be read, or the API cache is off.
 */
async function readInsightCacheEntry< Insight >(
	key: string
): Promise< InsightCacheEntry< Insight > | undefined > {
	if ( ! usingCache() ) {
		return undefined;
	}

	try {
		const { cacheHit, value } = await getItem( key );

		return cacheHit && isPlainObject( value )
			? ( value as InsightCacheEntry< Insight > )
			: undefined;
	} catch {
		// `getItem()` throws for an entry that isn't valid JSON. Without the
		// entry, the store asks for the insight rather than waiting for good.
		return undefined;
	}
}

/**
 * Writes the entry the store keeps for an insight.
 *
 * @since n.e.x.t
 *
 * @param {string} key   The key of the entry.
 * @param {Object} entry The entry.
 * @param {number} ttl   The time to keep the entry, in seconds.
 * @return {Promise} A promise that resolves once the entry is written.
 */
async function writeInsightCacheEntry< Insight >(
	key: string,
	entry: InsightCacheEntry< Insight >,
	ttl: number
): Promise< void > {
	if ( usingCache() ) {
		await setItem( key, entry, { ttl } );
	}
}

/**
 * Deletes the entry the store keeps for an insight.
 *
 * @since n.e.x.t
 *
 * @param {string} key The key of the entry.
 * @return {Promise} A promise that resolves once the entry is deleted.
 */
async function deleteInsightCacheEntry( key: string ): Promise< void > {
	if ( usingCache() ) {
		await deleteItem( key );
	}
}

/**
 * Gets the outcome or the operation that is in a cache entry.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} entry The cache entry, if there is one.
 * @return {Object} The outcome as `outcome`, or the operation as `operation`, or neither when the entry has nothing to use.
 */
function readCacheEntryStep< Insight >(
	entry?: InsightCacheEntry< Insight >
): {
	outcome?: AIInsightOutcome< Insight >;
	operation?: PendingOperation;
} {
	if ( entry && 'insight' in entry && isInsightOrNull( entry.insight ) ) {
		return { outcome: { insight: entry.insight } };
	}

	if ( entry && 'error' in entry && isPlainObject( entry.error ) ) {
		return { outcome: { error: entry.error } };
	}

	if (
		entry &&
		'operationID' in entry &&
		typeof entry.operationID === 'string' &&
		entry.operationID !== '' &&
		typeof entry.createdAt === 'number'
	) {
		return {
			operation: {
				operationID: entry.operationID,
				createdAt: entry.createdAt,
			},
		};
	}

	return {};
}

/**
 * Asks the service for the insight.
 *
 * The service answers from its cache with the insight, or starts to generate
 * it and returns the operation that does. While the service is too busy to
 * accept the request, the store asks again after the `Retry-After` of each
 * refusal, or `AI_INSIGHT_RETRY_INTERVAL` without one, until the deadline.
 *
 * @since n.e.x.t
 *
 * @param {Object} request  The requests and the cache entry of the insight.
 * @param {number} deadline The time to give up at, in milliseconds since the Unix epoch.
 * @return {Promise<Object>} The insight as `insight`, the error as `error`, or the operation to read as `operation`, with the time to wait before its first read as `delay`.
 */
async function submitInsight< Insight >(
	request: AIInsightRequest< Insight >,
	deadline: number
): Promise< SubmitStep< Insight > > {
	let result = await request.submit();

	while (
		result.error &&
		RETRIED_SUBMIT_STATUSES.includes(
			getErrorStatus( result.error ) as number
		)
	) {
		const delay = getRetryAfterDelay(
			result.error.data?.retryAfter,
			AI_INSIGHT_RETRY_INTERVAL
		);

		// A wait that ends at the deadline or after it isn't started.
		if ( getCurrentTime() + delay >= deadline ) {
			break;
		}

		await sleep( delay );

		// A device that slept through the wait wakes up after the deadline.
		if ( getCurrentTime() >= deadline ) {
			break;
		}

		result = await request.submit();
	}

	const { response, error } = result;

	if ( error ) {
		return { error };
	}

	if (
		response &&
		'insight' in response &&
		isInsightOrNull( response.insight )
	) {
		return { insight: response.insight as Insight | null };
	}

	if ( ! response?.operationID ) {
		return {
			error: getInvalidResponseError( request.invalidResponseErrorCode ),
		};
	}

	const operation = {
		operationID: response.operationID,
		createdAt: getCurrentTime(),
	};

	// The operation is kept while it runs, which is up to an hour in the
	// service, so a reload reads it rather than asking for the insight again.
	await writeInsightCacheEntry(
		request.cacheKey,
		operation,
		HOUR_IN_SECONDS
	);

	return {
		operation,
		delay: getRetryAfterDelay(
			response.retryAfter,
			AI_INSIGHT_POLL_INTERVAL
		),
	};
}

/**
 * Reads the operation that generates the insight.
 *
 * @since n.e.x.t
 *
 * @param {Object}  request          The requests and the cache entry of the insight.
 * @param {Object}  args             The read.
 * @param {Object}  args.operation   The operation, with its `operationID` and the time it was `createdAt`.
 * @param {boolean} args.canResubmit Whether the store can still ask for the insight again.
 * @return {Promise<Object>} The insight as `insight`, the error as `error`, `resubmit` to ask for the insight again, or `pending` to read the operation again after `delay` milliseconds: the `Retry-After` of the read, or `AI_INSIGHT_POLL_INTERVAL` without one.
 */
async function readOperation< Insight >(
	request: AIInsightRequest< Insight >,
	{
		operation,
		canResubmit,
	}: {
		operation: PendingOperation;
		canResubmit: boolean;
	}
): Promise< ReadStep< Insight > > {
	const { operationID, createdAt } = operation;
	const { response, error } = await request.readOperation( operationID );

	if ( error ) {
		const status = getErrorStatus( error );
		const isLost = RESUBMITTED_OPERATION_STATUSES.includes(
			status as number
		);

		// A failed generation, which includes one an instance shutdown
		// interrupted, and a read the service refused, which includes an
		// expired operation, delete the stored operation, so the next load
		// asks for the insight again. Any other failure of the read, such as a
		// network error or a read that ran past the service's time limit,
		// keeps it, so the next load reads the generation that may still run.
		if (
			error.code === request.failedErrorCode ||
			( status !== undefined && status >= 400 && status < 500 )
		) {
			await deleteInsightCacheEntry( request.cacheKey );
		}

		return isLost && canResubmit ? { resubmit: true } : { error };
	}

	if ( response?.done ) {
		if ( 'insight' in response && isInsightOrNull( response.insight ) ) {
			return { insight: response.insight as Insight | null };
		}

		// A done operation without an insight to read is deleted, so the
		// next load asks for the insight again.
		await deleteInsightCacheEntry( request.cacheKey );

		return {
			error: getInvalidResponseError( request.invalidResponseErrorCode ),
		};
	}

	// An operation whose instance crashed runs until its record expires.
	if ( getCurrentTime() - createdAt >= AI_INSIGHT_OPERATION_LIFETIME ) {
		await deleteInsightCacheEntry( request.cacheKey );

		return canResubmit
			? { resubmit: true }
			: { error: getTimeoutError( request.timeoutErrorCode ) };
	}

	return {
		pending: true,
		delay: getRetryAfterDelay(
			response?.retryAfter,
			AI_INSIGHT_POLL_INTERVAL
		),
	};
}

/**
 * Asks the service for the insight, and waits until it arrives.
 *
 * The store reads the operation that generates the insight until it is done,
 * after the `Retry-After` of the answer that returned the operation and then
 * after that of each read, or `AI_INSIGHT_POLL_INTERVAL` without one. Reading
 * an operation doesn't count against the service's rate limit, so the store
 * asks for the insight again only when the service's client contract says
 * to: once, when the operation has expired, was interrupted, or is older than
 * `AI_INSIGHT_OPERATION_LIFETIME`. A wait that gives up at the deadline
 * leaves the operation in the cache entry for the next load.
 *
 * @since n.e.x.t
 *
 * @param {Object} request            The requests and the cache entry of the insight.
 * @param {Object} [pendingOperation] Optional. The operation read back from the cache entry.
 * @return {Promise<Object>} The insight as `insight`, or the error as `error`.
 */
async function waitForInsight< Insight >(
	request: AIInsightRequest< Insight >,
	pendingOperation?: PendingOperation
): Promise< AIInsightOutcome< Insight > > {
	const deadline = getCurrentTime() + AI_INSIGHT_DEADLINE;

	let operation = pendingOperation;
	// A lost operation is replaced only once, so the store never alternates
	// between asking and reading for good.
	let canResubmit = true;
	// The time to wait before the next read, in milliseconds. An operation
	// read back from the cache may have finished in the meantime, so it is
	// read without a wait.
	let delay = 0;

	// Each step waits for the one before it, so the loop runs the requests
	// one after the other.
	while ( getCurrentTime() < deadline ) {
		if ( ! operation ) {
			const step = await submitInsight( request, deadline );

			if ( ! ( 'operation' in step ) ) {
				return step;
			}

			operation = step.operation;
			delay = step.delay;
		}

		if ( delay > 0 ) {
			// A wait that ends at the deadline or after it isn't started.
			if ( getCurrentTime() + delay >= deadline ) {
				break;
			}

			await sleep( delay );

			// A device that slept through the wait wakes up after the
			// deadline.
			if ( getCurrentTime() >= deadline ) {
				break;
			}
		}

		const step = await readOperation( request, {
			operation,
			canResubmit,
		} );

		if ( 'resubmit' in step ) {
			canResubmit = false;
			operation = undefined;
		} else if ( 'pending' in step ) {
			delay = step.delay;
		} else {
			return step;
		}
	}

	return { error: getTimeoutError( request.timeoutErrorCode ) };
}

/**
 * Gets an insight from its cache entry, or from the service, and keeps the
 * outcome in the cache entry.
 *
 * A failure is kept for as long as `getFailureLifetime()` says, and the
 * operation of a wait that gave up stays in the entry, so the next load
 * reads it.
 *
 * @since n.e.x.t
 *
 * @param {Object} request The requests and the cache entry of the insight.
 * @return {Promise<Object>} The insight as `insight`, or the error as `error`.
 */
export async function resolveAIInsight< Insight >(
	request: AIInsightRequest< Insight >
): Promise< AIInsightOutcome< Insight > > {
	const { outcome: cachedOutcome, operation } = readCacheEntryStep(
		await readInsightCacheEntry< Insight >( request.cacheKey )
	);

	if ( cachedOutcome ) {
		return cachedOutcome;
	}

	const outcome = await waitForInsight( request, operation );

	if ( 'insight' in outcome ) {
		// The service keeps an insight for a day. The insight keeps
		// describing the period when the figures change later in the day,
		// rather than costing a generation each time they do.
		await writeInsightCacheEntry(
			request.cacheKey,
			outcome,
			DAY_IN_SECONDS
		);
	} else {
		const lifetime = getFailureLifetime( outcome.error );

		if ( lifetime ) {
			await writeInsightCacheEntry( request.cacheKey, outcome, lifetime );
		}
	}

	return outcome;
}
