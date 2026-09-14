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
import { getDimensionFiltersForEvents } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { SITE_GOALS_WIDGET_EVENTS } from '@/js/modules/analytics-4/datastore/site-goals-settings';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { isZeroReport } from '@/js/modules/analytics-4/utils/is-zero-report';

/**
 * Checks whether the selected dashboard date range has any conversion event
 * for a goal type.
 *
 * The report counts every event of the goal type, including the events Site
 * Kit didn't attribute to a plugin or a form.
 *
 * @since n.e.x.t
 *
 * @param {GoalType} goalType Goal type whose conversion events to count.
 * @return {boolean|undefined} `true` when the selected date range has at least one event, and `false` when it has none. `undefined` while the report loads and when it fails.
 */
export function useSiteGoalsHasEventsInDateRange(
	goalType: GoalType
): boolean | undefined {
	const { startDate, endDate } = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: false } ),
		[]
	) as { startDate: string; endDate: string };

	const reportOptions: ReportOptions = useMemo(
		() => ( {
			startDate,
			endDate,
			metrics: [ { name: 'eventCount' } ],
			dimensionFilters: getDimensionFiltersForEvents(
				SITE_GOALS_WIDGET_EVENTS[ goalType ]
			),
			reportID: `analytics-4_site-goals_events-in-date-range_${ goalType }`,
		} ),
		[ endDate, goalType, startDate ]
	);

	const report = useInViewSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
		[ reportOptions ]
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

	if ( isLoadingReport || reportError ) {
		return undefined;
	}

	return ! isZeroReport( report );
}
