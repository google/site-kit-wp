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
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { buildRankedReportOptions } from './reportOptionsHelpers';
import { BuildGoalDriverReportOptionsArgs } from './types';

export function buildTopAuthorsReportOptions(
	args: BuildGoalDriverReportOptionsArgs
): ReportOptions | undefined {
	return buildRankedReportOptions( {
		...args,
		dimensions: [ 'customEvent:googlesitekit_post_author', 'eventName' ],
		reportIDSuffix: 'top-authors',
		extraDimensionFilters: ( eventDimensionFilters ) => ( {
			...( eventDimensionFilters || {} ),
			'customEvent:googlesitekit_post_author': {
				filterType: 'emptyFilter',
				notExpression: true,
			},
		} ),
	} );
}
