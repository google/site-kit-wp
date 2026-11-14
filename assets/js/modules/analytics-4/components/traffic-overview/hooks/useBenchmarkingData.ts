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
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';

export interface BenchmarkingDataOptions {
	/** Whether the hook requests the response. Default is `true`. */
	isEnabled?: boolean;
}

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
	/** Requests the response again after the request fails. */
	retry: () => void;
}

/**
 * Resolves the benchmarking response for the selected date range.
 *
 * On a view-only dashboard, the hook sends no request until the user's role
 * can view Analytics.
 *
 * @since 1.190.0
 * @since n.e.x.t Added the `isEnabled` option and the `retry` function, and sends no request while a view-only user's role cannot view Analytics.
 *
 * @param {Object}  [options]           Optional. The hook's options.
 * @param {boolean} [options.isEnabled] Optional. Whether the hook requests the response. Default is `true`.
 * @return {Object} The selected date range, and the response, whether it is loading, its error, and a function that requests it again.
 */
export function useBenchmarkingData( {
	isEnabled = true,
}: BenchmarkingDataOptions = {} ): BenchmarkingData {
	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	// On a view-only dashboard, `canViewSharedAnalytics4` reads `undefined`
	// until the user's capabilities load. Neither `undefined` nor `false`
	// sends a request.
	const shouldRequest = isEnabled && canViewSharedAnalytics4;

	const response = useInViewSelect< DecodedBenchmarkingResponse | undefined >(
		( select: Select ) =>
			shouldRequest
				? select( MODULES_ANALYTICS_4 ).getBenchmarkingData(
						startDate,
						endDate
				  )
				: undefined,
		[ shouldRequest, startDate, endDate ]
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

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	// `ReportError` invalidates the resolution of the error it shows just
	// before it calls `onRetry`, so the two calls send one request.
	// `clearBenchmarkingData()` invalidates only once it has cleared the API
	// cache, and the late call would send a second request.
	const retry = useCallback( () => {
		invalidateResolution( 'getBenchmarkingData', [ startDate, endDate ] );
	}, [ invalidateResolution, startDate, endDate ] );

	return { startDate, endDate, response, loading, error, retry };
}
