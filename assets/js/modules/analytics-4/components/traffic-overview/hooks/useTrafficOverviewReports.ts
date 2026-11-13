/**
 * Traffic Overview `useTrafficOverviewReports` hook.
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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getTotalsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { useBenchmarkingData } from './useBenchmarkingData';
import { useKeyFactorsVisibility } from './useKeyFactorsVisibility';
import { useTrafficBreakdownReports } from './useTrafficBreakdownReports';
import { useTrafficReport } from './useTrafficReport';

export interface TrafficOverviewReports {
	/**
	 * The report of total visitors over the selected range, against the range
	 * before it.
	 */
	totalsReport?: Report;
	/**
	 * The visits of each breakdown column over the selected range, keyed by the
	 * column's `id`, each ordered by visits, most first.
	 */
	breakdownValues: Record< string, TrafficBreakdownValue[] >;
	/**
	 * The benchmarking response for the selected range. The hook requests it
	 * only where the panel has the key factors.
	 */
	benchmarkingResponse?: DecodedBenchmarkingResponse;
	/**
	 * `true` once the totals report and the three breakdown reports have
	 * finished resolving, and the benchmarking response has arrived or failed
	 * where the hook requests it.
	 */
	loaded: boolean;
	/**
	 * The errors of the totals report and of the channels, locations, and
	 * devices reports, in that order, then the benchmarking request's error.
	 * The array is empty when nothing failed. The "Retry" button requests
	 * again the data whose errors it receives.
	 */
	errors: Array< Record< string, unknown > >;
	/** Requests the benchmarking response again after its request fails. */
	retryBenchmarkingData: () => void;
}

/**
 * Resolves the GA4 reports and the benchmarking response the Traffic Overview
 * panel needs.
 *
 * The benchmarking response covers the whole site, and only the
 * `typicalTraffic` feature adds its datapoint, so the hook requests it only
 * where the panel has the key factors.
 *
 * @since 1.188.0
 * @since n.e.x.t Removed the daily-visitors report, added the benchmarking response, and changed `breakdownReports` to `breakdownValues`.
 *
 * @return {Object} The totals report, the values of each breakdown column, and the benchmarking response, whether they have finished, their errors, and a function that requests the benchmarking response again.
 */
export function useTrafficOverviewReports(): TrafficOverviewReports {
	const { compareStartDate, compareEndDate } = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	const totalsReportOptions = useMemo(
		() => getTotalsReportOptions( { compareStartDate, compareEndDate } ),
		[ compareStartDate, compareEndDate ]
	);

	const totals = useTrafficReport( totalsReportOptions );
	const breakdown = useTrafficBreakdownReports();

	const { isAvailable: hasKeyFactors } = useKeyFactorsVisibility();

	const {
		response: benchmarkingResponse,
		error: benchmarkingError,
		retry: retryBenchmarkingData,
	} = useBenchmarkingData( { isEnabled: hasKeyFactors } );

	const reportsLoaded = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).areReportsLoading(
				totals.args,
				...breakdown.args
			),
		[ totals.args, breakdown.args ]
	);

	const reportErrors = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReportErrors(
				totals.args,
				...breakdown.args
			),
		[ totals.args, breakdown.args ]
	);

	const benchmarkingLoaded = !! benchmarkingResponse || !! benchmarkingError;

	return {
		totalsReport: totals.report,
		breakdownValues: breakdown.values,
		benchmarkingResponse,
		loaded: reportsLoaded && ( ! hasKeyFactors || benchmarkingLoaded ),
		errors: benchmarkingError
			? [ ...reportErrors, benchmarkingError ]
			: reportErrors,
		retryBenchmarkingData,
	};
}
