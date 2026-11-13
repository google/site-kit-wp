/**
 * Traffic Overview `useEntityTrafficReports` hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import {
	DAILY_VISITS_REPORT_OPTIONS,
	getTotalsReportOptions,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { useTrafficReport } from './useTrafficReport';

// The panel shows no change against the range before, so the totals report
// leaves that range out.
const TOTALS_REPORT_OPTIONS = getTotalsReportOptions();

export interface EntityTrafficReports {
	/** The report of unique visitors over the selected range. */
	totalsReport?: Report;
	/**
	 * The report of visits on each day of the selected range, with the visits
	 * over the whole range in its totals.
	 */
	dailyVisitsReport?: Report;
	/** `true` once both reports have finished resolving. */
	loaded: boolean;
	/**
	 * The totals report's error, then the daily visits report's error, or an
	 * empty array when neither failed. The "Retry" button requests again the
	 * reports whose errors it receives.
	 */
	errors: Array< Record< string, unknown > >;
}

/**
 * Resolves the GA4 reports the Traffic Overview panel needs on the entity
 * dashboard.
 *
 * The benchmarking response covers the whole site, so the entity dashboard,
 * which shows one page, reads the page's visits from GA4 reports instead.
 * `useTrafficReport` limits both reports to the entity URL.
 *
 * @since n.e.x.t
 *
 * @return {Object} The totals report and the daily visits report, whether they have finished, and their errors.
 */
export function useEntityTrafficReports(): EntityTrafficReports {
	const totals = useTrafficReport( TOTALS_REPORT_OPTIONS );
	const dailyVisits = useTrafficReport( DAILY_VISITS_REPORT_OPTIONS );

	const loaded = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).areReportsLoading(
				totals.args,
				dailyVisits.args
			),
		[ totals.args, dailyVisits.args ]
	);

	const errors = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReportErrors(
				totals.args,
				dailyVisits.args
			),
		[ totals.args, dailyVisits.args ]
	);

	return {
		totalsReport: totals.report,
		dailyVisitsReport: dailyVisits.report,
		loaded,
		errors,
	};
}
