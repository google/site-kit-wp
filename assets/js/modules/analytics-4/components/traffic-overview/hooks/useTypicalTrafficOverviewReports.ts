/**
 * Traffic Overview `useTypicalTrafficOverviewReports` hook.
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
import { getTotalsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { DAILY_VISITS_REPORT_OPTIONS } from '@/js/modules/analytics-4/components/traffic-overview/typicalReportOptions';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { useBenchmarkingData } from './useBenchmarkingData';
import { useKeyFactorsVisibility } from './useKeyFactorsVisibility';
import { useTrafficBreakdownReports } from './useTrafficBreakdownReports';
import { useTrafficReport } from './useTrafficReport';
import { useTypicalTrafficDateRange } from './useTypicalTrafficDateRange';

export interface TypicalTrafficOverviewReports {
	/**
	 * The report of total visitors over the selected range, against the range
	 * before it.
	 */
	totalsReport?: Report;
	/**
	 * The report of visits on each day of the selected range, against the
	 * range before it, with the visits over each range in its totals. The
	 * hook requests it only when the benchmarking request fails, so the panel
	 * can still draw the visits and add them up without the response.
	 */
	dailyVisitsReport?: Report;
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
	 * The error the benchmarking request failed with, or `undefined` when it
	 * did not fail or the hook does not request it.
	 */
	benchmarkingError?: Record< string, unknown >;
	/**
	 * `true` once the totals report and the three breakdown reports have
	 * finished resolving, and the benchmarking response has arrived where the
	 * hook requests it. When the benchmarking request fails, `true` once the
	 * daily visits report has finished resolving as well.
	 */
	loaded: boolean;
	/**
	 * The errors the panel shows in place of its sections: those of the
	 * totals report, of the channels, locations, and devices reports, and of
	 * the daily visits report where the hook requests it, in that order, then
	 * the benchmarking request's error when it failed too. The array is empty
	 * when no report failed, since a failed benchmarking request alone leaves
	 * the panel its figures. The "Retry" button requests again the data whose
	 * errors it receives.
	 */
	errors: Array< Record< string, unknown > >;
	/** Requests the benchmarking response again after its request fails. */
	retryBenchmarkingData: () => void;
}

/**
 * Resolves the GA4 reports and the benchmarking response the Typical Traffic
 * Overview panel needs.
 *
 * The benchmarking response covers the whole site, and only the
 * `typicalTraffic` feature adds its datapoint, so the hook requests it only
 * where the panel has the key factors. When its request fails, the hook
 * requests the daily visits report, which the panel draws and adds up in its
 * place, so a failed benchmarking request never leaves the panel without its
 * figures.
 *
 * @since n.e.x.t
 *
 * @return {Object} The totals report, the daily visits report, the values of each breakdown column, and the benchmarking response, whether they have finished, their errors, and a function that requests the benchmarking response again.
 */
export function useTypicalTrafficOverviewReports(): TypicalTrafficOverviewReports {
	// The typical traffic view ends its ranges on the last full day.
	const { startDate, endDate, compareStartDate, compareEndDate } =
		useTypicalTrafficDateRange();

	const totalsReportOptions = useMemo(
		() => ( {
			startDate,
			endDate,
			...getTotalsReportOptions( { compareStartDate, compareEndDate } ),
		} ),
		[ startDate, endDate, compareStartDate, compareEndDate ]
	);

	// The range before the selected one gives the visits the panel compares
	// the selected range's visits with.
	const dailyVisitsReportOptions = useMemo(
		() => ( {
			...DAILY_VISITS_REPORT_OPTIONS,
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
		} ),
		[ startDate, endDate, compareStartDate, compareEndDate ]
	);

	const totals = useTrafficReport( totalsReportOptions );
	const breakdown = useTrafficBreakdownReports();

	const { isAvailable: hasKeyFactors } = useKeyFactorsVisibility();

	const {
		response: benchmarkingResponse,
		error: benchmarkingError,
		retry: retryBenchmarkingData,
	} = useBenchmarkingData( { isEnabled: hasKeyFactors } );

	// Without the benchmarking response, the panel reads the visits it draws
	// and adds up from the daily visits report.
	const hasBenchmarkingError = hasKeyFactors && !! benchmarkingError;

	const dailyVisits = useTrafficReport( dailyVisitsReportOptions, {
		isEnabled: hasBenchmarkingError,
	} );

	// A report the hook doesn't request would read as loading for good, so
	// the daily visits report counts only once the hook requests it.
	const reportArgs = useMemo(
		() =>
			hasBenchmarkingError
				? [ totals.args, ...breakdown.args, dailyVisits.args ]
				: [ totals.args, ...breakdown.args ],
		[ hasBenchmarkingError, totals.args, breakdown.args, dailyVisits.args ]
	);

	const reportsLoaded = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).areReportsLoading( ...reportArgs ),
		[ reportArgs ]
	);

	const reportErrors = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReportErrors( ...reportArgs ),
		[ reportArgs ]
	);

	const benchmarkingLoaded = !! benchmarkingResponse || hasBenchmarkingError;

	return {
		totalsReport: totals.report,
		dailyVisitsReport: dailyVisits.report,
		breakdownValues: breakdown.values,
		benchmarkingResponse,
		benchmarkingError: hasBenchmarkingError ? benchmarkingError : undefined,
		loaded: reportsLoaded && ( ! hasKeyFactors || benchmarkingLoaded ),
		errors:
			hasBenchmarkingError && reportErrors.length > 0
				? [ ...reportErrors, benchmarkingError ]
				: reportErrors,
		retryBenchmarkingData,
	};
}
