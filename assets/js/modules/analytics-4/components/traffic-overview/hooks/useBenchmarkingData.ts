/**
 * Traffic Overview `useBenchmarkingData` hook.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';

export interface BenchmarkingData {
	/** The first day of the selected date range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected date range, as `YYYY-MM-DD`. */
	endDate: string;
	/** The decoded response, or `undefined` while there is none. */
	response?: DecodedBenchmarkingResponse;
	/** `true` while the request for the response is in progress. */
	loading: boolean;
	/** The error the request failed with, or `undefined` when it did not fail. */
	error?: Record< string, unknown >;
}

/**
 * Resolves the benchmarking response for the selected date range.
 *
 * @since 1.190.0
 *
 * @return {Object} The selected date range, and the response, whether it is loading, and its error.
 */
export function useBenchmarkingData(): BenchmarkingData {
	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const response = useInViewSelect< DecodedBenchmarkingResponse | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getBenchmarkingData(
				startDate,
				endDate
			),
		[ startDate, endDate ]
	);

	const loading = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).isLoadingBenchmarkingData(
				startDate,
				endDate
			),
		[ startDate, endDate ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getBenchmarkingData',
				[ startDate, endDate ]
			),
		[ startDate, endDate ]
	);

	return { startDate, endDate, response, loading, error };
}
