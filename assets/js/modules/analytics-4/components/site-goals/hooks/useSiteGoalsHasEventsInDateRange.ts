/**
 * Site Goals events in date range hook.
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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { getSiteGoalsEventCountReportOptions } from '@/js/modules/analytics-4/components/site-goals/utils/getSiteGoalsEventCountReportOptions';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { isZeroReport } from '@/js/modules/analytics-4/utils/is-zero-report';

interface UseSiteGoalsHasEventsInDateRangeOptions {
	/** Whether to request the event report. */
	shouldFetchReport: boolean;
}

/**
 * Checks whether the selected dashboard date range has any conversion event
 * for a goal type.
 *
 * The report counts every event of the goal type, including the events Site
 * Kit didn't attribute to a plugin or a form.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType                  The goal type whose conversion events the hook counts.
 * @param {Object}   options                   The hook options.
 * @param {boolean}  options.shouldFetchReport Whether to request the event report.
 * @return {(boolean|null|undefined)} `true` when the selected date range has at least one event, and `false` when it has none. `null` when the report fails, and `undefined` while it loads or while `shouldFetchReport` is `false`.
 */
export function useSiteGoalsHasEventsInDateRange(
	goalType: GoalType,
	{ shouldFetchReport }: UseSiteGoalsHasEventsInDateRangeOptions
): boolean | null | undefined {
	const { startDate, endDate } = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: false } ),
		[]
	) as { startDate: string; endDate: string };

	const reportOptions: ReportOptions = useMemo(
		() =>
			getSiteGoalsEventCountReportOptions(
				{ startDate, endDate },
				goalType
			),
		[ endDate, goalType, startDate ]
	);

	const report = useInViewSelect(
		( select: Select ) =>
			shouldFetchReport
				? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
				: undefined,
		[ reportOptions, shouldFetchReport ]
	);

	const isLoadingReport = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).areReportsLoading( reportOptions ),
		[ report, reportOptions ]
	) as boolean;

	const reportError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError( reportOptions ),
		[ report, reportOptions ]
	);

	if ( ! shouldFetchReport || isLoadingReport ) {
		return undefined;
	}

	if ( reportError ) {
		return null;
	}

	return ! isZeroReport( report );
}
