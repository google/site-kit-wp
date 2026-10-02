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

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { get } from 'googlesitekit-api';
import {
	Select,
	combineStores,
	commonActions,
	createReducer,
	createRegistrySelector,
} from 'googlesitekit-data';
// In the built plugin, `googlesitekit-api` is the `googlesitekit.api` global,
// which has no `createCacheKey()`.
import { createCacheKey } from '@/js/googlesitekit/api';
import { deleteItem } from '@/js/googlesitekit/api/cache';
import { createFetchStore } from '@/js/googlesitekit/data/create-fetch-store';
import { createValidatedAction } from '@/js/googlesitekit/data/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { decodeBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { isValidDateString } from '@/js/util';
import { isValidDateRange } from '@/js/util/report-validation';
import { MODULES_ANALYTICS_4 } from './constants';
import { ReportOptions } from './types';

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
}

const CLEAR_BENCHMARKING_DATA = 'CLEAR_BENCHMARKING_DATA';

/**
 * Throws an error when either date is missing or isn't a valid `YYYY-MM-DD` date.
 *
 * @since n.e.x.t
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

const fetchGetBenchmarkingDataStore = createFetchStore( {
	baseName: 'getBenchmarkingData',
	controlCallback: async ( params: BenchmarkingDataParams ) => {
		const encodedResponse = await get(
			'modules',
			MODULE_SLUG_ANALYTICS_4,
			'benchmarking-data',
			params
		);
		const response = decodeBenchmarkingResponse( encodedResponse );

		if ( ! response ) {
			throw {
				code: 'benchmarking_decode_failed',
				message: __(
					'Site Kit received data it can’t read. Reload the page to try again.',
					'google-site-kit'
				),
			};
		}

		return response;
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
			endDate: string
		) => unknown;
	};
};

const baseInitialState: BenchmarkingState = {
	benchmarkingData: {},
};

const baseActions = {
	/**
	 * Deletes the benchmarking response for a date range from the store and from the API cache.
	 *
	 * The next `getBenchmarkingData()` call with the same `startDate` and
	 * `endDate` then requests the response from the server.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {void}
	 */
	clearBenchmarkingData: createValidatedAction(
		( startDate: string, endDate: string ) =>
			validateBenchmarkingDataParams( { startDate, endDate } ),
		function* (
			startDate: string,
			endDate: string
		): Generator< unknown, void, unknown > {
			const registry =
				( yield commonActions.getRegistry() ) as WPDataRegistry;

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
};

const baseReducer = createReducer(
	(
		state: BenchmarkingState,
		{ type, payload }: { type: string; payload: BenchmarkingDataParams }
	) => {
		switch ( type ) {
			case CLEAR_BENCHMARKING_DATA: {
				const { startDate, endDate } = payload;
				delete state.benchmarkingData[ `${ startDate }::${ endDate }` ];
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
		const registry =
			( yield commonActions.getRegistry() ) as WPDataRegistry;

		if (
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( startDate, endDate ) !== undefined
		) {
			return;
		}

		yield fetchGetBenchmarkingDataStore.actions.fetchGetBenchmarkingData(
			startDate,
			endDate
		);
	},
};

const baseSelectors = {
	/**
	 * Gets the decoded benchmarking response for a date range.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state     The data store's state.
	 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
	 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
	 * @return {(Object|undefined)} The response with `visitors`, `dailyTraffic`, `dimensions`, and `contextualData`, or `undefined` if the response hasn't loaded.
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
	 * @since n.e.x.t
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
};

const store = combineStores( fetchGetBenchmarkingDataStore, {
	initialState: baseInitialState,
	actions: baseActions,
	reducer: baseReducer,
	resolvers: baseResolvers,
	selectors: baseSelectors,
} );

export default store;
