/**
 * Analytics datastore test factory: benchmarking.
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
import benchmarkingData from '@/js/modules/analytics-4/datastore/__fixtures__/benchmarking-data.json';
import { BenchmarkingDataParams } from '@/js/modules/analytics-4/datastore/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { decodeBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/decodeBenchmarkingResponse';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * The decoded `benchmarking-data.json` fixture, which is never `null` because the
 * fixture is a valid response in format version `1`.
 */
export const decodedBenchmarkingResponse = decodeBenchmarkingResponse(
	benchmarkingData
) as DecodedBenchmarkingResponse;

/**
 * Puts a decoded benchmarking response in the store and finishes the resolution
 * of `getBenchmarkingData()` for a date range, so the selector returns the
 * response without a request.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry        The registry to dispatch to.
 * @param {Object} dates           The date range.
 * @param {string} dates.startDate The first day of the date range, as `YYYY-MM-DD`.
 * @param {string} dates.endDate   The last day of the date range, as `YYYY-MM-DD`.
 * @param {Object} [response]      Optional. The decoded response to store. Default is `decodedBenchmarkingResponse`.
 * @return {void}
 */
export function provideBenchmarkingData(
	registry: WPDataRegistry,
	{ startDate, endDate }: BenchmarkingDataParams,
	response: DecodedBenchmarkingResponse = decodedBenchmarkingResponse
): void {
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetBenchmarkingData( response, { startDate, endDate } );

	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getBenchmarkingData', [ startDate, endDate ] );
}
