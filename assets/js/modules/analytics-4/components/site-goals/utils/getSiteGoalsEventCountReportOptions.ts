/**
 * Site Goals event count report options.
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
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { getDimensionFiltersForEvents } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import { SITE_GOALS_WIDGET_EVENTS } from '@/js/modules/analytics-4/datastore/site-goals-settings';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

/**
 * Gets the options of the report that counts a goal type's conversion events
 * in a date range.
 *
 * The data store keeps one report for each set of options, so the same dates
 * and goal type always share one request.
 *
 * @since n.e.x.t
 *
 * @param {Object}   dates           The date range the report covers.
 * @param {string}   dates.startDate The first date, as `YYYY-MM-DD`, e.g. `2026-08-28`, not `20260828`.
 * @param {string}   dates.endDate   The last date, as `YYYY-MM-DD`, e.g. `2026-09-24`, not `20260924`.
 * @param {GoalType} goalType        The goal type whose conversion events the report counts.
 * @return {ReportOptions} The report options.
 */
export function getSiteGoalsEventCountReportOptions(
	{ startDate, endDate }: Pick< ReportOptions, 'startDate' | 'endDate' >,
	goalType: GoalType
): ReportOptions {
	return {
		startDate,
		endDate,
		metrics: [ { name: 'eventCount' } ],
		dimensionFilters: getDimensionFiltersForEvents(
			SITE_GOALS_WIDGET_EVENTS[ goalType ]
		),
		reportID: `analytics-4_site-goals_events-in-date-range_${ goalType }`,
	};
}
