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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { useTrafficReport } from './useTrafficReport';

export interface TrafficOverviewReports {
	/**
	 * The report of total visitors over the selected range, against the range
	 * before it.
	 */
	totalsReport?: Report;
	/** `true` when the totals report has finished resolving. */
	loaded: boolean;
	/**
	 * The totals report's error, alone in the array, or an empty array when
	 * the report did not fail. The "Retry" button re-requests the reports whose
	 * errors it receives.
	 */
	errors: Array< Record< string, unknown > >;
}

/**
 * Resolves the GA4 report the Traffic Overview panel needs.
 *
 * @since 1.188.0
 * @since n.e.x.t Removed the daily-visitors report and the three breakdown reports.
 *
 * @return {Object} The totals report, whether it has finished, and its error.
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

	const loaded = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).areReportsLoading( totals.args ),
		[ totals.args ]
	);

	const errors = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReportErrors( totals.args ),
		[ totals.args ]
	);

	return {
		totalsReport: totals.report,
		loaded,
		errors,
	};
}
