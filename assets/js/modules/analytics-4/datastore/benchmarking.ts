/**
 * `modules/analytics-4` data store: benchmarking.
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
import { get, set } from 'googlesitekit-api';
import {
	Registry,
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistryControl,
	createRegistrySelector,
} from 'googlesitekit-data';
// In the built plugin, `googlesitekit-api` is the `googlesitekit.api` global,
// which has no `createCacheKey()`.
import { createCacheKey } from '@/js/googlesitekit/api';
import { deleteItem } from '@/js/googlesitekit/api/cache';
import { actions as errorStoreActions } from '@/js/googlesitekit/data/create-error-store';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { decodeBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse';
import {
	BenchmarkingInsight,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import {
	DAY_IN_SECONDS,
	HOUR_IN_SECONDS,
	getPreviousDate,
	isValidDateString,
} from '@/js/util';
import { ErrorObject } from '@/js/util/errors';
import { isValidDateRange } from '@/js/util/report-validation';
import { MODULES_ANALYTICS_4 } from './constants';
import { ReportOptions } from './types';
import {
	AIInsightOperationResponse,
	AIInsightOutcome,
	AIInsightSubmitResponse,
	AI_INSIGHT_ERROR_CODES,
	getAIInsightErrorCode,
	getFailureLifetime,
	resolveAIInsight,
} from './utils/ai-insight';

const { clearSelectorError, setErrorForSelector } = errorStoreActions;

/**
 * The date range of a benchmarking request.
 *
 * @since 1.190.0
 */
export type BenchmarkingDataParams = Pick<
	ReportOptions,
	'startDate' | 'endDate'
>;

interface BenchmarkingState {
	/** The decoded response for each date range, under a key such as `2026-08-19::2026-09-15`. */
	benchmarkingData: Record<
		`${ string }::${ string }`,
		DecodedBenchmarkingResponse
	>;
	/** The generated insight for each date range, under the same key as its response, or null when there is none to show. */
	benchmarkingInsights: Record<
		`${ string }::${ string }`,
		BenchmarkingInsight | null
	>;
}

interface ResolveInsightPayload {
	/** The signed request of the insight, as the benchmarking response has it. */
	payload: string;
}

/**
 * The last days, today included, whose figures GA4 and Search Console may
 * still update. A date range that ends before them has figures that no longer
 * change.
 *
 * @since n.e.x.t
 */
const BENCHMARKING_DATA_SETTLING_DAYS = 3;

const CLEAR_BENCHMARKING_DATA = 'CLEAR_BENCHMARKING_DATA';
const RESOLVE_BENCHMARKING_INSIGHT = 'RESOLVE_BENCHMARKING_INSIGHT';
const RECEIVE_BENCHMARKING_INSIGHT = 'RECEIVE_BENCHMARKING_INSIGHT';
const CLEAR_BENCHMARKING_INSIGHT = 'CLEAR_BENCHMARKING_INSIGHT';

/**
 * Throws an error when either date is missing or isn't a valid `YYYY-MM-DD` date.
 *
 * @since 1.190.0
 *
 * @param {Object} params           The date range.
 * @param {string} params.startDate The first day of the date range.
 * @param {string} params.endDate   The last day of the date range.
 * @return {void}
 */
function validateBenchmarkingDataParams( {
	startDate,
	endDate,
}: Partial< BenchmarkingDataParams > ): void {
	// `isValidDateString()` accepts `2026-8-19`, and `isValidDateRange()` accepts
	// `2026-13-45`, so the dates have to pass both.
	invariant(
		isValidDateString( startDate ) &&
			isValidDateString( endDate ) &&
			isValidDateRange( { startDate, endDate } ),
		'Valid startDate and endDate values are required, each as YYYY-MM-DD.'
	);
}

/**
 * Gets how long the browser keeps the benchmarking response of a date range.
 *
 * GA4 and Search Console still update the figures of the last few days, so a
 * response for a date range that reaches them is kept for an hour, like any
 * other report. The figures of a date range that ends before them no longer
 * change, so its response is kept for a day.
 *
 * @since n.e.x.t
 *
 * @param {string} endDate       The last day of the date range, as `YYYY-MM-DD`.
 * @param {string} referenceDate Today, as `YYYY-MM-DD`.
 * @return {number} The time to keep the response, in seconds.
 */
export function getBenchmarkingDataCacheTTL(
	endDate: string,
	referenceDate: string
): number {
	return endDate <=
		getPreviousDate( referenceDate, BENCHMARKING_DATA_SETTLING_DAYS )
		? DAY_IN_SECONDS
		: HOUR_IN_SECONDS;
}

/**
 * Gets the key of the entry the store keeps for a generated insight in the
 * storage of the API cache.
 *
 * The key is the signed request the insight is written from, so the insight
 * and the figures it describes are always kept and replaced together: when a
 * new benchmarking response has other figures, it has another request, whose
 * insight isn't kept yet. The request has the locale and the user, so a change
 * of language asks for an insight in the new language.
 *
 * `API.set()` clears every key that starts with the name of the datapoint it
 * wrote to, so the entry has a group of its own rather than one that starts
 * with `benchmarking-insight`.
 *
 * @since n.e.x.t
 *
 * @param {string} payload The signed request of the insight, as the benchmarking response has it.
 * @return {string} The key.
 */
function getInsightCacheKey( payload: string ): string {
	return createCacheKey(
		'modules',
		MODULE_SLUG_ANALYTICS_4,
		'benchmarking-generated-insight',
		{ payload }
	);
}

/**
 * Gets how long the store keeps a failed request for a generated insight, so
 * the widget doesn't ask again on every load for an insight the service
 * would refuse or fail again.
 *
 * The entry is kept under the request the insight is written from, so a
 * failure is kept only for that request: new figures ask again. The store
 * reads the failure by the Site Kit service's code, as
 * `getAIInsightErrorCode()` does, and a code it doesn't know by its status.
 *
 * - A malformed request (`INVALID_ARGUMENT`) is refused again for the same
 *   request, so it is kept for a day, as long as an insight is. So is a
 *   request of a site the service has no record of (`SITE_NOT_FOUND`), which
 *   only a reset of Site Kit fixes, and which clears the entry.
 * - A failed generation (`MODEL_UNAVAILABLE`, `MODEL_OUTPUT_INVALID`, or
 *   `INTERNAL`, which is also how the datapoints answer any other failure of
 *   the service or of the site's request to it) can succeed on a later try,
 *   but each try can cost a generation from the rate limit, which refills two
 *   an hour. It is kept for an hour, so a failure that repeats never empties
 *   the rate limit.
 * - A refusal for permissions (`PERMISSION_DENIED`) is kept as for any
 *   generated insight, by `getFailureLifetime()`.
 *
 * Any other failure isn't kept, so the next load asks again: a service too
 * busy to start the generation or a generation that was interrupted
 * (`SERVICE_BUSY`), neither of which costs a generation, another request that
 * is still generating the insight (`GENERATION_IN_PROGRESS`), a lost
 * operation (`NOT_FOUND`), or a network error. A refusal for the quota
 * (`RATE_LIMITED` or `DAILY_CAP`) isn't kept here either: it holds back the
 * requests for every insight, for as long as `getQuotaHoldLifetime()` says.
 *
 * @since n.e.x.t
 *
 * @param {Object} error The error of the request.
 * @return {(number|undefined)} The time to keep the failure, in seconds, or `undefined` when it isn't kept.
 */
function getInsightFailureLifetime( error: ErrorObject ): number | undefined {
	switch ( getAIInsightErrorCode( error ) ) {
		case AI_INSIGHT_ERROR_CODES.INVALID_ARGUMENT:
		case AI_INSIGHT_ERROR_CODES.SITE_NOT_FOUND:
			return DAY_IN_SECONDS;

		case AI_INSIGHT_ERROR_CODES.MODEL_UNAVAILABLE:
		case AI_INSIGHT_ERROR_CODES.MODEL_OUTPUT_INVALID:
		case AI_INSIGHT_ERROR_CODES.INTERNAL:
			return HOUR_IN_SECONDS;

		default:
			return getFailureLifetime( error );
	}
}

const fetchGetBenchmarkingDataStore = createFetchStore( {
	baseName: 'getBenchmarkingData',
	controlCallback: async (
		params: BenchmarkingDataParams,
		{ cacheTTL = HOUR_IN_SECONDS }: { cacheTTL?: number } = {}
	) => {
		// Every tab of the login session shares the response, so a new tab
		// doesn't build it again from the reports while it is valid.
		const encodedResponse = await get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'benchmarking-data',
			params,
			{ cacheTTL, shared: true }
		);
		const decodedResponse = decodeBenchmarkingResponse( encodedResponse );

		if ( ! decodedResponse ) {
			// `get()` has already stored the encoded response in the API cache.
			// Delete it from the cache, so a reload sends a new request.
			await deleteItem(
				createCacheKey(
					'modules',
					MODULE_SLUG_ANALYTICS_4,
					'benchmarking-data',
					params
				)
			);

			throw {
				code: 'benchmarking_decode_failed',
				message: __(
					'Site Kit received data it can’t read. Reload the page to try again.',
					'google-site-kit'
				),
			};
		}

		return decodedResponse;
	},
	reducerCallback: createReducer(
		(
			state: BenchmarkingState,
			response: DecodedBenchmarkingResponse,
			{ startDate, endDate }: BenchmarkingDataParams
		) => {
			state.benchmarkingData[ `${ startDate }::${ endDate }` ] = response;
		}
	),
	argsToParams: ( startDate: string, endDate: string ) => ( {
		startDate,
		endDate,
	} ),
	validateParams: validateBenchmarkingDataParams,
} ) as {
	actions: {
		fetchGetBenchmarkingData: (
			startDate: string,
			endDate: string,
			fetchOptions?: { cacheTTL: number }
		) => unknown;
	};
};

const fetchSubmitBenchmarkingInsightStore = createFetchStore( {
	baseName: 'submitBenchmarkingInsight',
	controlCallback: ( {
		payload,
	}: {
		payload: string;
	} ): Promise< AIInsightSubmitResponse< BenchmarkingInsight > > =>
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
	} ): Promise< AIInsightOperationResponse< BenchmarkingInsight > > =>
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

const baseInitialState: BenchmarkingState = {
	benchmarkingData: {},
	benchmarkingInsights: {},
};

const baseActions = {
	/**
	 * Deletes the benchmarking response for a date range from the store and
	 * the API cache, so the next `getBenchmarkingData()` call for those dates
	 * requests it again.
	 *
	 * The generated insight of the date range is written from the request
	 * that the response carries, so the action deletes it too, with
	 * `clearBenchmarkingInsight()`.
	 *
	 * @since 1.190.0
	 * @since n.e.x.t Deletes the generated insight of the date range too.
	 *
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {Object} Generator instance.
	 */
	clearBenchmarkingData: createValidatedAction(
		( startDate: string, endDate: string ) =>
			validateBenchmarkingDataParams( { startDate, endDate } ),
		function* (
			startDate: string,
			endDate: string
		): Generator< unknown, void, unknown > {
			const registry = ( yield commonActions.getRegistry() ) as Registry;

			// The key of the insight's cache entry is the request that the
			// response carries, so the insight goes while the store still has
			// the response.
			yield commonActions.await(
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearBenchmarkingInsight( startDate, endDate )
			);

			yield commonActions.await(
				deleteItem(
					createCacheKey(
						'modules',
						MODULE_SLUG_ANALYTICS_4,
						'benchmarking-data',
						{ startDate, endDate }
					)
				)
			);

			yield {
				type: CLEAR_BENCHMARKING_DATA,
				payload: { startDate, endDate },
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getBenchmarkingData', [
					startDate,
					endDate,
				] );
		}
	),

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

	/**
	 * Deletes the generated insight of a date range from the store and from
	 * the storage of the API cache, so the next `getBenchmarkingInsight()`
	 * call for those dates asks for it again.
	 *
	 * The key of the cache entry is the request that the benchmarking response
	 * for the same dates carries, so the entry is deleted only while the store
	 * has that response. `clearBenchmarkingData()` calls this action before it
	 * deletes the response.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {Object} Generator instance.
	 */
	clearBenchmarkingInsight: createValidatedAction(
		( startDate: string, endDate: string ) =>
			validateBenchmarkingDataParams( { startDate, endDate } ),
		function* (
			startDate: string,
			endDate: string
		): Generator< unknown, void, unknown > {
			const registry = ( yield commonActions.getRegistry() ) as Registry;
			const { getBenchmarkingData, hasFinishedResolution } =
				registry.select( MODULES_ANALYTICS_4 );

			// Reading the response before its request has finished would send
			// the request.
			const hasBenchmarkingResponse = hasFinishedResolution(
				'getBenchmarkingData',
				[ startDate, endDate ]
			);
			const benchmarkingResponse:
				| DecodedBenchmarkingResponse
				| undefined = hasBenchmarkingResponse
				? getBenchmarkingData( startDate, endDate )
				: undefined;

			// The entry is deleted even while the API cache is off, since it
			// may have been written while the cache was on.
			if ( benchmarkingResponse?.insightPayload ) {
				yield commonActions.await(
					deleteItem(
						getInsightCacheKey(
							benchmarkingResponse.insightPayload
						)
					)
				);
			}

			yield {
				type: CLEAR_BENCHMARKING_INSIGHT,
				payload: { startDate, endDate },
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getBenchmarkingInsight', [
					startDate,
					endDate,
				] );
		}
	),
};

const baseControls = {
	// The control runs the requests for the insight and the waits between
	// them, which the resolver can't run itself.
	[ RESOLVE_BENCHMARKING_INSIGHT ]: createRegistryControl(
		( registry: Registry ) =>
			( {
				payload: { payload },
			}: {
				payload: ResolveInsightPayload;
			} ) => {
				const {
					fetchSubmitBenchmarkingInsight,
					fetchGetBenchmarkingInsightOperation,
					clearSelectorError: clearError,
				} = registry.dispatch( MODULES_ANALYTICS_4 );

				return resolveAIInsight< BenchmarkingInsight >( {
					// The store reports the outcome as the error of
					// `getBenchmarkingInsight()`, not as the error of each
					// request.
					submit: async () => {
						const result = await fetchSubmitBenchmarkingInsight(
							payload
						);
						await clearError( 'submitBenchmarkingInsight', [
							payload,
						] );

						return result;
					},
					readOperation: async ( operationID: string ) => {
						const result =
							await fetchGetBenchmarkingInsightOperation(
								operationID
							);
						await clearError( 'getBenchmarkingInsightOperation', [
							operationID,
						] );

						return result;
					},
					cacheKey: getInsightCacheKey( payload ),
					// Every tab of the login session shares the entry, as it
					// shares the benchmarking response the request comes from.
					shared: true,
					getFailureLifetime: getInsightFailureLifetime,
					invalidResponseErrorCode:
						'invalid_benchmarking_insight_response',
					timeoutErrorCode: 'benchmarking_insight_timeout',
					failedErrorCode: 'benchmarking_insight_failed',
				} );
			}
	),
};

const baseReducer = createReducer(
	(
		state: BenchmarkingState,
		{
			type,
			payload,
		}: {
			type: string;
			payload: BenchmarkingDataParams & {
				insight?: BenchmarkingInsight | null;
			};
		}
	) => {
		switch ( type ) {
			case CLEAR_BENCHMARKING_DATA: {
				const { startDate, endDate } = payload;
				delete state.benchmarkingData[ `${ startDate }::${ endDate }` ];
				break;
			}

			case RECEIVE_BENCHMARKING_INSIGHT: {
				const { insight, startDate, endDate } = payload;
				state.benchmarkingInsights[ `${ startDate }::${ endDate }` ] =
					insight ?? null;
				break;
			}

			case CLEAR_BENCHMARKING_INSIGHT: {
				const { startDate, endDate } = payload;
				delete state.benchmarkingInsights[
					`${ startDate }::${ endDate }`
				];
				break;
			}

			default:
				break;
		}
	}
);

const baseResolvers = {
	*getBenchmarkingData(
		startDate: string,
		endDate: string
	): Generator< unknown, void, unknown > {
		const registry = ( yield commonActions.getRegistry() ) as Registry;

		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( startDate, endDate ) !== undefined
		) {
			return;
		}

		const referenceDate: string = registry
			.select( CORE_USER )
			.getReferenceDate();

		yield fetchGetBenchmarkingDataStore.actions.fetchGetBenchmarkingData(
			startDate,
			endDate,
			{ cacheTTL: getBenchmarkingDataCacheTTL( endDate, referenceDate ) }
		);
	},

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
			payload: { payload: benchmarkingResponse.insightPayload },
		} ) as AIInsightOutcome< BenchmarkingInsight >;

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
	 * Gets the decoded benchmarking response for a date range.
	 *
	 * @since 1.190.0
	 * @since 1.191.0 Returns `visits` and `keyFactors` in place of `visitors`, `dimensions`, and `contextualData`.
	 *
	 * @param {Object} state     The data store's state.
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {(Object|undefined)} The decoded response with `visits`, `dailyTraffic`, and `keyFactors`, or `undefined` while the store has none, like during the request or after it fails.
	 */
	getBenchmarkingData(
		state: BenchmarkingState,
		startDate: string,
		endDate: string
	): DecodedBenchmarkingResponse | undefined {
		return state.benchmarkingData[ `${ startDate }::${ endDate }` ];
	},

	/**
	 * Checks whether a request for the benchmarking response of a date range is in progress.
	 *
	 * @since 1.190.0
	 *
	 * @param {Object} state     The data store's state.
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {boolean} `true` from the start of the request until the store has the decoded response or the error, otherwise `false`.
	 */
	isLoadingBenchmarkingData: createRegistrySelector(
		( select: Select ) =>
			(
				_state: BenchmarkingState,
				startDate: string,
				endDate: string
			): boolean =>
				select( MODULES_ANALYTICS_4 ).isFetchingGetBenchmarkingData(
					startDate,
					endDate
				)
	),

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
		state: BenchmarkingState,
		startDate: string,
		endDate: string
	): BenchmarkingInsight | null | undefined {
		return state.benchmarkingInsights[ `${ startDate }::${ endDate }` ];
	},
};

const store = combineStores(
	fetchGetBenchmarkingDataStore,
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
