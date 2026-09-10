/**
 * Top authors goal driver report options.
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
 *
 * This driver's percentage is a share of every matching event site-wide, not
 * just the ranked rows shown, so `TopAuthorsGoalDriver` maps rows with
 * `makeShareOfExplicitTotalMapper` (in `rowMapperHelpers.ts`) paired with
 * `buildGoalDriverTotalReportOptions` (in `reportOptionsHelpers.ts`), rather
 * than a row mapper exported from here.
 */

/**
 * Internal dependencies
 */
import {
	getDimensionFiltersForEvents,
	normalizePrimaryEvents,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/utils';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { withContextSuffix } from './reportOptionsHelpers';
import { BuildGoalDriverReportOptionsArgs } from './types';

export function buildTopAuthorsReportOptions( {
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

	const eventDimensionFilters = getDimensionFiltersForEvents(
		eventNames,
		breakdownFilter
	);

	// Assigned to a variable, rather than returned directly, so the
	// `notExpression` filter field (missing from `ReportOptions`, but
	// accepted by the Analytics 4 report endpoint) isn't rejected by an
	// excess property check against the function's declared return type.
	const options = {
		...dates,
		dimensions: [ 'customEvent:googlesitekit_post_author', 'eventName' ],
		dimensionFilters: {
			...( eventDimensionFilters || {} ),
			'customEvent:googlesitekit_post_author': {
				filterType: 'emptyFilter',
				notExpression: true,
			},
		},
		metrics: [ { name: 'eventCount' } ],
		orderby: [
			{
				metric: { metricName: 'eventCount' },
				desc: true,
			},
		],
		limit,
		keepEmptyRows: false,
		reportID: withContextSuffix(
			'analytics-4_goal-driver-reports_top-authors',
			context
		),
	};

	return options;
}
