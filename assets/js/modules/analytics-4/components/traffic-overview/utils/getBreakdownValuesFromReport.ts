/**
 * Traffic Overview breakdown values from a GA4 report.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { TrafficBreakdownValue } from './getBreakdownRows';
import { getMetricValue } from './getMetricValue';

/**
 * Gets the values of a breakdown column from its GA4 report, in the shape the
 * Traffic Overview breakdown reads.
 *
 * The report orders its rows by visits, most first, so the values keep the
 * report's order. Each label is the dimension value exactly as GA4 returned
 * it.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. The breakdown report, `undefined` until the request has finished.
 * @return {Array.<Object>} The column's values, in the report's order, or an empty array without a report.
 */
export function getBreakdownValuesFromReport(
	report?: Report
): TrafficBreakdownValue[] {
	return ( report?.rows ?? [] ).map( ( row ) => ( {
		label: row.dimensionValues?.[ 0 ]?.value ?? '',
		visits: getMetricValue( row ),
	} ) );
}
