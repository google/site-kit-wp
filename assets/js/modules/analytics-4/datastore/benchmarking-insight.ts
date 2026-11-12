/**
 * `modules/analytics-4` data store: benchmarking insight.
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
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { get, set, usingCache } from 'googlesitekit-api';
import {
	Registry,
	combineStores,
	commonActions,
	createReducer,
	createRegistryControl,
} from 'googlesitekit-data';
// In the built plugin, `googlesitekit-api` is the `googlesitekit.api` global,
// which has no `createCacheKey()`.
import { createCacheKey } from '@/js/googlesitekit/api';
import { deleteItem, getItem, setItem } from '@/js/googlesitekit/api/cache';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	BenchmarkingInsight,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { DAY_IN_SECONDS, HOUR_IN_SECONDS } from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import { BenchmarkingDataParams } from './benchmarking';
import { MODULES_ANALYTICS_4 } from './constants';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

/**
 * The longest the store waits for an insight, in milliseconds.
 *
 * The service stops a generation that runs longer than its worker allows,
 * which is 60 seconds. A wait that gives up still leaves the generation
 * running, and the service keeps its result for the next request.
 *
 * @since n.e.x.t
 */
export const BENCHMARKING_INSIGHT_DEADLINE = 60 * 1000;

/**
 * The time between two reads of the operation that generates an insight, in
 * milliseconds: the `Retry-After` the service sends while it runs.
 *
 * @since n.e.x.t
 */
export const BENCHMARKING_INSIGHT_POLL_INTERVAL = 2 * 1000;

/**
 * The time before the store asks again for an insight that the service
 * turned away for being busy, in milliseconds: the `Retry-After` the service
 * sends with a 409 or a 503.
 *
 * @since n.e.x.t
 */
export const BENCHMARKING_INSIGHT_RETRY_INTERVAL = 5 * 1000;

/**
 * The age at which an operation that still runs is taken for lost, in
 * milliseconds: the longest the service's client contract tells a client to
 * read an operation.
 *
 * @since n.e.x.t
 */
export const BENCHMARKING_INSIGHT_OPERATION_LIFETIME = 2 * 60 * 1000;

/**
 * The statuses of a refused request for an insight that the store sends
 * again after `BENCHMARKING_INSIGHT_RETRY_INTERVAL`: the service was setting up
 * an identical request (409), or had no capacity for a new one (503). Neither
 * spends the service's rate limit.
 */
const RETRIED_SUBMIT_STATUSES = [ 409, 503 ];

/**
 * The statuses of a failed read of an operation after which the store asks for
 * the insight again, once: the operation has expired (404), or its instance
 * stopped before it finished (503).
 */
const RESUBMITTED_OPERATION_STATUSES = [ 404, 503 ];

const RESOLVE_BENCHMARKING_INSIGHT = 'RESOLVE_BENCHMARKING_INSIGHT';
const RECEIVE_BENCHMARKING_INSIGHT = 'RECEIVE_BENCHMARKING_INSIGHT';

interface SubmitBenchmarkingInsightResponse {
	/** The ID of the operation that generates the insight, when the service has to generate it. */
	operationID?: string;
	/** The insight, when the service already had it. */
	insight?: BenchmarkingInsight;
}

interface BenchmarkingInsightOperationResponse {
	/** Whether the operation has finished. */
	done: boolean;
	/** `RUNNING` until the operation has finished, then `SUCCEEDED`. A failed operation is an error. */
	state: 'RUNNING' | 'SUCCEEDED';
	/** The insight, once the operation has succeeded. */
	insight?: BenchmarkingInsight;
}

interface FetchResult< Response > {
	response?: Response;
	error?: ErrorObject;
}

interface PendingOperation {
	/** The ID of the operation that generates the insight. */
	operationID: string;
	/** The time the service returned the operation, in milliseconds since the Unix epoch. */
	createdAt: number;
}

/**
 * The entry the store keeps for the insight of a date range in the storage of
 * the API cache: the insight, a failure that the service would only repeat,
 * or the operation that generates the insight.
 */
type InsightCacheEntry =
	| { insight: BenchmarkingInsight }
	| { error: ErrorObject }
	| PendingOperation;

/**
 * What the store ends up with: the insight or the error that stopped it.
 */
type InsightOutcome = { insight: BenchmarkingInsight } | { error: ErrorObject };

/**
 * The step after a request: an outcome, or an operation to read.
 */
type SubmitStep = InsightOutcome | { operation: PendingOperation };

/**
 * The step after a read of an operation: an outcome, a new request for the
 * insight, or another read.
 */
type ReadStep = InsightOutcome | { resubmit: true } | { pending: true };

interface ResolveInsightPayload {
	/** The signed request of the insight, as the benchmarking response has it. */
	payload: string;
	/** The key of the cache entry of the insight. */
	cacheKey: string;
}

interface BenchmarkingInsightState {
	/** The insight for each date range, under a key such as `2026-08-19::2026-09-15`, or null when there is none to show. */
	benchmarkingInsights: Record<
		`${ string }::${ string }`,
		BenchmarkingInsight | null
	>;
}

const fetchSubmitBenchmarkingInsightStore = createFetchStore( {
	baseName: 'submitBenchmarkingInsight',
	controlCallback: ( {
		payload,
	}: {
		payload: string;
	} ): Promise< SubmitBenchmarkingInsightResponse > =>
		set( 'modules', MODULE_SLUG_ANALYTICS_4, 'benchmarking-insight', {
			payload,
		} ),
	argsToParams: ( payload: string ) => ( { payload } ),
	validateParams: ( { payload }: { payload?: string } = {} ) => {
		invariant(
			typeof payload === 'string' && payload.length > 0,
			'payload is required.'
		);
	},
} );

const fetchGetBenchmarkingInsightOperationStore = createFetchStore( {
	baseName: 'getBenchmarkingInsightOperation',
	controlCallback: ( {
		operationID,
	}: {
		operationID: string;
	} ): Promise< BenchmarkingInsightOperationResponse > =>
		// The operation changes while its ID stays the same, so its state
		// must never come from the API cache.
		get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'benchmarking-insight',
			{ operationID },
			{ useCache: false }
		),
	argsToParams: ( operationID: string ) => ( { operationID } ),
	validateParams: ( { operationID }: { operationID?: string } = {} ) => {
		invariant(
			typeof operationID === 'string' && operationID.length > 0,
			'operationID is required.'
		);
	},
} );

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
 * @return {Object} The error.
 */
function getInvalidResponseError(): ErrorObject {
	return {
		code: 'invalid_benchmarking_insight_response',
		message: __(
			'Site Kit received a generated insight it can’t read.',
			'google-site-kit'
		),
		data: { status: 500 },
	};
}

/**
 * Gets the error the store gives up with when the insight takes longer than
 * `BENCHMARKING_INSIGHT_DEADLINE`.
 *
 * @since n.e.x.t
 *
 * @return {Object} The error.
 */
function getTimeoutError(): ErrorObject {
	return {
		code: 'benchmarking_insight_timeout',
		message: __(
			'The generated insight took too long to arrive.',
			'google-site-kit'
		),
	};
}

/**
 * Gets how long the store keeps a failure, so the widget doesn't ask again on
 * every load for an insight that the service would refuse.
 *
 * A refusal for the rate limit (429) is kept for at least an hour, in which
 * the user's own allowance accepts a request again, and for as long as the
 * service's `Retry-After` asks, such as until the daily cap resets, up to a
 * day. A refusal for permissions (403) is kept for an hour. Nothing else is
 * kept, so the next load asks again.
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
 * Gets the key of the entry the store keeps for the insight of a date range
 * in the storage of the API cache.
 *
 * `API.set()` clears every key that starts with the name of the datapoint it
 * wrote to, so the entry has a group of its own rather than one that starts
 * with `benchmarking-insight`. The key has the locale, so a change of language
 * asks for an insight in the new language.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
 * @param {string} locale    The locale the insight is written in.
 * @return {string} The key.
 */
function getInsightCacheKey(
	startDate: string,
	endDate: string,
	locale: string
): string {
	return createCacheKey(
		'modules',
		MODULE_SLUG_ANALYTICS_4,
		'benchmarking-generated-insight',
		{ startDate, endDate, locale }
	);
}

/**
 * Reads the entry the store keeps for the insight of a date range.
 *
 * @since n.e.x.t
 *
 * @param {string} key The key of the entry.
 * @return {Promise<(Object|undefined)>} The entry, or `undefined` when there is none, it has expired, or the API cache is off.
 */
async function readInsightCacheEntry(
	key: string
): Promise< InsightCacheEntry | undefined > {
	if ( ! usingCache() ) {
		return undefined;
	}

	const { cacheHit, value } = await getItem( key );

	return cacheHit && isPlainObject( value )
		? ( value as InsightCacheEntry )
		: undefined;
}

/**
 * Writes the entry the store keeps for the insight of a date range.
 *
 * @since n.e.x.t
 *
 * @param {string} key   The key of the entry.
 * @param {Object} entry The entry.
 * @param {number} ttl   The time to keep the entry, in seconds.
 * @return {Promise} A promise that resolves once the entry is written.
 */
async function writeInsightCacheEntry(
	key: string,
	entry: InsightCacheEntry,
	ttl: number
): Promise< void > {
	if ( usingCache() ) {
		await setItem( key, entry, { ttl } );
	}
}

/**
 * Deletes the entry the store keeps for the insight of a date range.
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
 * Gets the outcome or the operation that a cache entry holds.
 *
 * @since n.e.x.t
 *
 * @param {(Object|undefined)} entry The cache entry, if there is one.
 * @return {Object} The outcome as `outcome`, or the operation as `operation`, or neither when the entry has nothing to use.
 */
function readCacheEntryStep( entry?: InsightCacheEntry ): {
	outcome?: InsightOutcome;
	operation?: PendingOperation;
} {
	if ( entry && 'insight' in entry && isPlainObject( entry.insight ) ) {
		return { outcome: { insight: entry.insight } };
	}

	if ( entry && 'error' in entry && isPlainObject( entry.error ) ) {
		return { outcome: { error: entry.error } };
	}

	if (
		entry &&
		'operationID' in entry &&
		typeof entry.operationID === 'string' &&
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
 * accept the request, the store asks again every
 * `BENCHMARKING_INSIGHT_RETRY_INTERVAL` until the deadline.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry      The data registry.
 * @param {Object} args          The request.
 * @param {string} args.payload  The signed request of the insight.
 * @param {string} args.cacheKey The key of the cache entry of the insight.
 * @param {number} deadline      The time to give up at, in milliseconds since the Unix epoch.
 * @return {Promise<Object>} The insight as `insight`, the error as `error`, or the operation to read as `operation`.
 */
async function submitInsight(
	registry: Registry,
	{ payload, cacheKey }: ResolveInsightPayload,
	deadline: number
): Promise< SubmitStep > {
	const { fetchSubmitBenchmarkingInsight, clearSelectorError: clearError } =
		registry.dispatch( MODULES_ANALYTICS_4 );

	let result: FetchResult< SubmitBenchmarkingInsightResponse > =
		await fetchSubmitBenchmarkingInsight( payload );

	while (
		result.error &&
		RETRIED_SUBMIT_STATUSES.includes(
			getErrorStatus( result.error ) as number
		) &&
		getCurrentTime() + BENCHMARKING_INSIGHT_RETRY_INTERVAL < deadline
	) {
		await sleep( BENCHMARKING_INSIGHT_RETRY_INTERVAL );
		result = await fetchSubmitBenchmarkingInsight( payload );
	}

	// The store reports the outcome as the error of `getBenchmarkingInsight()`,
	// not as the error of each request.
	await clearError( 'submitBenchmarkingInsight', [ payload ] );

	const { response, error } = result;

	if ( error ) {
		return { error };
	}

	if ( response?.insight ) {
		return { insight: response.insight };
	}

	if ( ! response?.operationID ) {
		return { error: getInvalidResponseError() };
	}

	const operation = {
		operationID: response.operationID,
		createdAt: getCurrentTime(),
	};

	// The operation is kept while it runs, which is up to an hour in the
	// service, so a reload reads it rather than asking for the insight again.
	await writeInsightCacheEntry( cacheKey, operation, HOUR_IN_SECONDS );

	return { operation };
}

/**
 * Reads the operation that generates the insight.
 *
 * @since n.e.x.t
 *
 * @param {Object}  registry         The data registry.
 * @param {Object}  args             The read.
 * @param {Object}  args.operation   The operation, with its `operationID` and the time it was `createdAt`.
 * @param {string}  args.cacheKey    The key of the cache entry of the insight.
 * @param {boolean} args.canResubmit Whether the store can still ask for the insight again.
 * @return {Promise<Object>} The insight as `insight`, the error as `error`, `resubmit` to ask for the insight again, or `pending` to read the operation again.
 */
async function readOperation(
	registry: Registry,
	{
		operation,
		cacheKey,
		canResubmit,
	}: {
		operation: PendingOperation;
		cacheKey: string;
		canResubmit: boolean;
	}
): Promise< ReadStep > {
	const { operationID, createdAt } = operation;
	const {
		fetchGetBenchmarkingInsightOperation,
		clearSelectorError: clearError,
	} = registry.dispatch( MODULES_ANALYTICS_4 );

	const result: FetchResult< BenchmarkingInsightOperationResponse > =
		await fetchGetBenchmarkingInsightOperation( operationID );
	const { response, error } = result;

	await clearError( 'getBenchmarkingInsightOperation', [ operationID ] );

	if ( error ) {
		const status = getErrorStatus( error ) as number;
		const isLost = RESUBMITTED_OPERATION_STATUSES.includes( status );

		// A failed generation stays in the cache entry, so a reload reads the
		// failure rather than asking for a generation the service would charge
		// again. An operation that this request can't read is dropped.
		if ( isLost || ( status >= 400 && status < 500 ) ) {
			await deleteInsightCacheEntry( cacheKey );
		}

		return isLost && canResubmit ? { resubmit: true } : { error };
	}

	if ( response?.done ) {
		return response.insight
			? { insight: response.insight }
			: { error: getInvalidResponseError() };
	}

	// An operation whose instance crashed runs until its record expires.
	if (
		getCurrentTime() - createdAt >=
		BENCHMARKING_INSIGHT_OPERATION_LIFETIME
	) {
		await deleteInsightCacheEntry( cacheKey );

		return canResubmit ? { resubmit: true } : { error: getTimeoutError() };
	}

	return { pending: true };
}

/**
 * Asks the service for the insight, and waits until it arrives.
 *
 * The store reads the operation that generates the insight every
 * `BENCHMARKING_INSIGHT_POLL_INTERVAL` until it is done. Reading an operation
 * spends none of the service's rate limit, so the store asks for the insight
 * again only when the service's client contract says to: once, when the
 * operation has expired, was interrupted, or is older than
 * `BENCHMARKING_INSIGHT_OPERATION_LIFETIME`. A wait that gives up at the
 * deadline leaves the operation in the cache entry for the next load.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry           The data registry.
 * @param {Object} args               The request.
 * @param {string} args.payload       The signed request of the insight.
 * @param {string} args.cacheKey      The key of the cache entry of the insight.
 * @param {Object} [pendingOperation] Optional. The operation read back from the cache entry.
 * @return {Promise<Object>} The insight as `insight`, or the error as `error`.
 */
async function waitForInsight(
	registry: Registry,
	args: ResolveInsightPayload,
	pendingOperation?: PendingOperation
): Promise< InsightOutcome > {
	const deadline = getCurrentTime() + BENCHMARKING_INSIGHT_DEADLINE;

	let operation = pendingOperation;
	// A lost operation is replaced only once, so the store never alternates
	// between asking and reading for good.
	let canResubmit = true;
	// An operation read back from the cache may have finished in the
	// meantime, so it is read without a wait.
	let shouldWait = false;

	// Each step waits for the one before it, so the loop runs the requests
	// one after the other.
	while ( getCurrentTime() < deadline ) {
		if ( ! operation ) {
			const step = await submitInsight( registry, args, deadline );

			if ( ! ( 'operation' in step ) ) {
				return step;
			}

			operation = step.operation;
			shouldWait = true;
		}

		if ( shouldWait ) {
			if (
				getCurrentTime() + BENCHMARKING_INSIGHT_POLL_INTERVAL >=
				deadline
			) {
				break;
			}

			await sleep( BENCHMARKING_INSIGHT_POLL_INTERVAL );
		}

		shouldWait = true;

		const step = await readOperation( registry, {
			operation,
			cacheKey: args.cacheKey,
			canResubmit,
		} );

		if ( 'resubmit' in step ) {
			canResubmit = false;
			operation = undefined;
		} else if ( ! ( 'pending' in step ) ) {
			return step;
		}
	}

	return { error: getTimeoutError() };
}

/**
 * Gets the insight from the cache entry, or from the service, and keeps the
 * outcome in the cache entry.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry      The data registry.
 * @param {Object} args          The request.
 * @param {string} args.payload  The signed request of the insight.
 * @param {string} args.cacheKey The key of the cache entry of the insight.
 * @return {Promise<Object>} The insight as `insight`, or the error as `error`.
 */
async function resolveInsight(
	registry: Registry,
	args: ResolveInsightPayload
): Promise< InsightOutcome > {
	const { outcome: cachedOutcome, operation } = readCacheEntryStep(
		await readInsightCacheEntry( args.cacheKey )
	);

	if ( cachedOutcome ) {
		return cachedOutcome;
	}

	const outcome = await waitForInsight( registry, args, operation );

	if ( 'insight' in outcome ) {
		// The service keeps an insight for a day. The insight keeps
		// describing the period when the figures change later in the day,
		// rather than costing a generation each time they do.
		await writeInsightCacheEntry( args.cacheKey, outcome, DAY_IN_SECONDS );
	} else {
		const lifetime = getFailureLifetime( outcome.error );

		if ( lifetime ) {
			await writeInsightCacheEntry( args.cacheKey, outcome, lifetime );
		}
	}

	return outcome;
}

const baseInitialState: BenchmarkingInsightState = {
	benchmarkingInsights: {},
};

const baseActions = {
	/**
	 * Stores the generated insight of the benchmarking response for a date
	 * range.
	 *
	 * @since n.e.x.t
	 *
	 * @param {(Object|null)} insight          The insight, or null when there is none to show.
	 * @param {Object}        params           The date range.
	 * @param {string}        params.startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string}        params.endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {Object} Redux-style action.
	 */
	receiveBenchmarkingInsight(
		insight: BenchmarkingInsight | null,
		{ startDate, endDate }: BenchmarkingDataParams
	) {
		invariant(
			insight === null || isPlainObject( insight ),
			'insight must be an object or null.'
		);
		invariant(
			startDate && endDate,
			'startDate and endDate are required.'
		);

		return {
			type: RECEIVE_BENCHMARKING_INSIGHT,
			payload: { insight, startDate, endDate },
		};
	},
};

const baseControls = {
	// The control runs the requests for the insight and the waits between
	// them, which the resolver can't run itself.
	[ RESOLVE_BENCHMARKING_INSIGHT ]: createRegistryControl(
		( registry: Registry ) =>
			( { payload }: { payload: ResolveInsightPayload } ) =>
				resolveInsight( registry, payload )
	),
};

const baseReducer = createReducer(
	(
		state: BenchmarkingInsightState,
		{
			type,
			payload,
		}: {
			type: string;
			payload: BenchmarkingDataParams & {
				insight: BenchmarkingInsight | null;
			};
		}
	) => {
		switch ( type ) {
			case RECEIVE_BENCHMARKING_INSIGHT: {
				const { insight, startDate, endDate } = payload;
				state.benchmarkingInsights[ `${ startDate }::${ endDate }` ] =
					insight;
				break;
			}

			default:
				break;
		}
	}
);

const baseResolvers = {
	*getBenchmarkingInsight(
		startDate: string,
		endDate: string
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingInsight( startDate, endDate ) !== undefined
		) {
			return;
		}

		yield clearSelectorError( 'getBenchmarkingInsight', [
			startDate,
			endDate,
		] );

		// The insight is written from the request that the benchmarking
		// response for the same dates carries, so a failed generation never
		// costs the panel its numbers.
		const benchmarkingResponse = ( yield commonActions.await(
			registry
				.resolveSelect( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( startDate, endDate )
		) ) as DecodedBenchmarkingResponse | undefined;

		// A response without a payload has no insight to request: the
		// feature is off, the period is too short or too long, the site had
		// no visits, or the request for the response failed.
		if ( ! benchmarkingResponse?.insightPayload ) {
			yield baseActions.receiveBenchmarkingInsight( null, {
				startDate,
				endDate,
			} );
			return;
		}

		const outcome = ( yield {
			type: RESOLVE_BENCHMARKING_INSIGHT,
			payload: {
				payload: benchmarkingResponse.insightPayload,
				cacheKey: getInsightCacheKey(
					startDate,
					endDate,
					benchmarkingResponse.insightLocale || ''
				),
			},
		} ) as InsightOutcome;

		if ( 'insight' in outcome ) {
			yield baseActions.receiveBenchmarkingInsight( outcome.insight, {
				startDate,
				endDate,
			} );
			return;
		}

		yield baseActions.receiveBenchmarkingInsight( null, {
			startDate,
			endDate,
		} );

		yield setErrorForSelector( outcome.error, 'getBenchmarkingInsight', [
			startDate,
			endDate,
		] );
	},
};

const baseSelectors = {
	/**
	 * Gets the generated insight of the benchmarking response for a date
	 * range.
	 *
	 * The first call for a date range waits for the benchmarking response,
	 * then asks the Site Kit service for the insight that the response's
	 * request describes, and waits until it arrives. Read the error that
	 * stopped it with
	 * `getErrorForSelector( 'getBenchmarkingInsight', [ startDate, endDate ] )`.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     The data store's state.
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {(Object|null|undefined)} The insight, with `scenario`, `teaser`, `analysis`, `driver`, `interactionID` and `modelVersion`; null when there is none to show, because the response has no insight to request or the request failed; or `undefined` while it loads.
	 */
	getBenchmarkingInsight(
		state: BenchmarkingInsightState,
		startDate: string,
		endDate: string
	): BenchmarkingInsight | null | undefined {
		return state.benchmarkingInsights[ `${ startDate }::${ endDate }` ];
	},
};

const store = combineStores(
	fetchSubmitBenchmarkingInsightStore,
	fetchGetBenchmarkingInsightOperationStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export default store;
