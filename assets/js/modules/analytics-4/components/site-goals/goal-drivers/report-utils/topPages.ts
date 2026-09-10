/**
 * Top pages goal driver report options and row mapper.
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
	ReportOptions,
	ReportRow,
} from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { buildRankedReportOptions } from './reportOptionsHelpers';
import { parseMetricValue } from './rowMapperHelpers';
import { BuildGoalDriverReportOptionsArgs } from './types';

export function buildTopPagesReportOptions(
	args: BuildGoalDriverReportOptionsArgs
): ReportOptions | undefined {
	return buildRankedReportOptions( {
		...args,
		dimensions: [ 'pagePath', 'eventName' ],
		reportIDSuffix: 'top-pages',
	} );
}

/**
 * Maps rows to a raw event count rather than a share of the total.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} rows Report rows, each carrying `eventCount` in `metricValues[0]`.
 * @return {Object[]} The rows mapped to `{ label, value, pagePath }`.
 */
export function mapTopPagesRows( rows: ReportRow[] ): GoalDriverRow[] {
	return rows.map( ( row ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value || '';
		const eventCount = parseMetricValue( row, 0 );

		return {
			label: pagePath,
			value: numFmt( eventCount ),
			pagePath,
		};
	} );
}
