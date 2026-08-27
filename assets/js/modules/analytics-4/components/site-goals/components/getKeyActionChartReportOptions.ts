/**
 * Site Goals Key action chart report options.
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
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';

export interface KeyActionChartReportArgs {
	/** The selected date range. The report counts the events in it by day. */
	dates: Pick< ReportOptions, 'startDate' | 'endDate' >;
	/** The Key action's event names, counted together. */
	eventNames: string[];
	/** The widget's goal. The report ID ends with it. */
	goalType: GoalType;
	/** The selected breakdown tab's filter. */
	breakdownFilter?: Record< string, unknown >;
}

/**
 * Builds the options for one event count per day, filtered to the Key action's
 * events and to the selected breakdown tab.
 *
 * @since n.e.x.t
 *
 * @param {Object} args                   The report inputs.
 * @param {Object} args.dates             The selected date range.
 * @param {Array}  args.eventNames        The Key action's event names, counted together.
 * @param {string} args.goalType          The widget's goal. The report ID ends with it.
 * @param {Object} [args.breakdownFilter] The selected breakdown tab's filter.
 * @return {Object} The report options `getReport` takes.
 */
export default function getKeyActionChartReportOptions( {
	dates,
	eventNames,
	goalType,
	breakdownFilter,
}: KeyActionChartReportArgs ): ReportOptions {
	return {
		startDate: dates.startDate,
		endDate: dates.endDate,
		metrics: [ { name: 'eventCount' } ],
		dimensions: [ { name: 'date' } ],
		dimensionFilters: getDimensionFiltersForEvents(
			eventNames,
			breakdownFilter
		),
		orderby: [ { dimension: { dimensionName: 'date' } } ],
		reportID: `analytics-4_site-goals_key-action-over-time_${ goalType }`,
	};
}
