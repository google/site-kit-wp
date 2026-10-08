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
import { normalizePrimaryEvents } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import {
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import {
	buildRankedReportOptions,
	withContextSuffix,
} from './reportOptionsHelpers';
import { parseMetricValue } from './rowMapperHelpers';
import { BuildGoalDriverReportOptionsArgs } from './types';

export function buildTopTrafficChannelsRateReportOptions(
	args: BuildGoalDriverReportOptionsArgs
): ReportOptions | undefined {
	return buildRankedReportOptions( {
		...args,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [ { name: 'eventCount' }, { name: 'sessions' } ],
		reportIDSuffix: 'top-traffic-channels-rate',
	} );
}

/**
 * Builds the Analytics 4 report options for each channel's total sessions.
 *
 * Each channel's rate is its sessions with a matching event out of this total.
 *
 * @since n.e.x.t
 *
 * @param {Object}          args                   Builder args.
 * @param {Object}          [args.dates]           The date range.
 * @param {string|string[]} [args.primaryEvent]    The primary conversion event name(s).
 * @param {Object}          [args.breakdownFilter] Optional dimension filter scoping the report to a breakdown tab.
 * @param {string}          [args.context]         Identifies the caller, appended to the reportID.
 * @return {Object|undefined} The Analytics 4 `getReport` options, or `undefined` when there is no primary event.
 */
export function buildTopTrafficChannelsSessionsReportOptions( {
	dates,
	primaryEvent,
	breakdownFilter,
	context,
}: BuildGoalDriverReportOptionsArgs ): ReportOptions | undefined {
	if ( ! dates || ! normalizePrimaryEvents( primaryEvent ).length ) {
		return undefined;
	}

	return {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [ { name: 'sessions' } ],
		...( breakdownFilter
			? {
					dimensionFilters:
						breakdownFilter as ReportOptions[ 'dimensionFilters' ],
			  }
			: {} ),
		reportID: withContextSuffix(
			'analytics-4_goal-driver-reports_top-traffic-channels-sessions',
			context
		),
	};
}

/**
 * Maps rows to that channel's own conversion rate, not a share of the total.
 *
 * @since 1.188.0
 * @since n.e.x.t Updated to divide by each channel's total sessions, so the rate can't exceed 100%.
 *
 * @param {Object[]} rows                  Report rows, each carrying `eventCount` and `sessions` in `metricValues`.
 * @param {Object}   [sessionsReport]      The report `buildTopTrafficChannelsSessionsReportOptions` requested.
 * @param {Object[]} [sessionsReport.rows] The report's rows.
 * @return {Object[]} The rows mapped to `{ label, value }`.
 */
export function mapTopTrafficChannelsRateRows(
	rows: ReportRow[],
	sessionsReport?: { rows?: ReportRow[] }
): GoalDriverRow[] {
	const sessionsByChannel = new Map(
		( sessionsReport?.rows || [] ).map( ( row ) => [
			row.dimensionValues?.[ 0 ]?.value,
			parseMetricValue( row ),
		] )
	);

	return rows.map( ( row ) => {
		const channel = row.dimensionValues?.[ 0 ]?.value;
		const convertingSessions = parseMetricValue( row, 1 );
		const sessions = sessionsByChannel.get( channel ) || 0;
		const rate = sessions > 0 ? convertingSessions / sessions : 0;

		return {
			label: channel || '-',
			value: numFmt( rate, {
				style: 'percent',
				signDisplay: 'never',
				maximumFractionDigits: 1,
			} ),
		};
	} );
}
