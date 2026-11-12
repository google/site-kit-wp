/**
 * Traffic Overview `useBenchmarkingInsight` hook.
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
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	BenchmarkingInsight,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';

export interface BenchmarkingInsightOptions {
	/** Whether the hook requests the insight. Default is `true`. */
	isEnabled?: boolean;
}

export interface BenchmarkingInsightResult {
	/** The generated insight, or null while there is none to show. */
	insight: BenchmarkingInsight | null;
	/** `true` while the hook waits for the insight. */
	loading: boolean;
}

/**
 * Resolves the generated insight of the benchmarking response for the selected
 * date range.
 *
 * The Site Kit service generates the insight from the figures of the
 * benchmarking response, so the hook requests it once the response has
 * arrived, and it arrives some seconds after the figures. When the request for
 * the response fails, the hook requests the insight once a retry brings the
 * response. A failed request for the insight leaves no insight to show, rather
 * than an error: the panel shows its figures without it.
 *
 * On a view-only dashboard, the hook sends no request until the user's role
 * can view Analytics.
 *
 * @since n.e.x.t
 *
 * @param {Object}  [options]           Optional. The hook's options.
 * @param {boolean} [options.isEnabled] Optional. Whether the hook requests the insight. Default is `true`.
 * @return {Object} The insight, or null while there is none to show, and whether it is loading.
 */
export function useBenchmarkingInsight( {
	isEnabled = true,
}: BenchmarkingInsightOptions = {} ): BenchmarkingInsightResult {
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
	const canRequest = isEnabled && !! canViewSharedAnalytics4;

	const benchmarkingResponse = useInViewSelect<
		DecodedBenchmarkingResponse | undefined
	>(
		( select: Select ) =>
			canRequest
				? select( MODULES_ANALYTICS_4 ).getBenchmarkingData(
						startDate,
						endDate
				  )
				: undefined,
		[ canRequest, startDate, endDate ]
	);

	const benchmarkingError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getBenchmarkingData',
				[ startDate, endDate ]
			),
		[ startDate, endDate ]
	);

	const hasBenchmarkingResponse = benchmarkingResponse !== undefined;

	const insight = useInViewSelect< BenchmarkingInsight | null | undefined >(
		( select: Select ) =>
			hasBenchmarkingResponse
				? select( MODULES_ANALYTICS_4 ).getBenchmarkingInsight(
						startDate,
						endDate
				  )
				: undefined,
		[ hasBenchmarkingResponse, startDate, endDate ]
	);

	// The insight loads after the user's capabilities and the benchmarking
	// response, unless the user can't view Analytics or the response failed.
	if (
		! isEnabled ||
		canViewSharedAnalytics4 === false ||
		benchmarkingError
	) {
		return { insight: null, loading: false };
	}

	return {
		insight: insight ?? null,
		loading: insight === undefined,
	};
}
