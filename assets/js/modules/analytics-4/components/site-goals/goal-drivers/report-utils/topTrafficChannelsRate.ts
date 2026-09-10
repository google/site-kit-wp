/**
 * Top traffic channels rate goal driver report options and row mapper.
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
import { GoalDriverRow } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import {
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { withContextSuffix } from './reportOptionsHelpers';
import { parseMetricValue } from './rowMapperHelpers';
import { BuildGoalDriverReportOptionsArgs } from './types';

export function buildTopTrafficChannelsRateReportOptions( {
	dates,
	primaryEvent,
	breakdownFilter,
	limit,
	context,
}: BuildGoalDriverReportOptionsArgs ): ReportOptions | undefined {
	const eventNames = normalizePrimaryEvents( primaryEvent );

	if ( ! dates || ! eventNames.length ) {
		return undefined;
	}

	// Assigned to a variable, rather than returned directly, so
	// `keepEmptyRows` (missing from `ReportOptions`, but accepted by the
	// Analytics 4 report endpoint) isn't rejected by an excess property
	// check against the function's declared return type.
	const options = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		dimensionFilters: getDimensionFiltersForEvents(
			eventNames,
			breakdownFilter
		),
		metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
		orderby: [
			{
				metric: { metricName: 'eventCount' },
				desc: true,
			},
		],
		limit,
		keepEmptyRows: false,
		reportID: withContextSuffix(
			'analytics-4_goal-driver-reports_top-traffic-channels-rate',
			context
		),
	};

	return options;
}

/**
 * Maps rows to that channel's own conversion rate, not a share of the total.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} rows Report rows, each carrying `eventCount` and `sessions` in `metricValues`.
 * @return {Object[]} The rows mapped to `{ label, value }`.
 */
export function mapTopTrafficChannelsRateRows(
	rows: ReportRow[]
): GoalDriverRow[] {
	return rows.map( ( row ) => {
		const channel = row.dimensionValues?.[ 0 ]?.value || '-';
		const eventCount = parseMetricValue( row, 0 );
		const sessions = parseMetricValue( row, 1 );
		const rate = sessions > 0 ? eventCount / sessions : 0;

		return {
			label: channel,
			value: numFmt( rate, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} ),
		};
	} );
}
