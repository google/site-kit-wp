/**
 * Recent activity `getMetricValue` utility.
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
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';

/**
 * Reads a row's metric value.
 *
 * The API returns metric values as strings.
 *
 * @since n.e.x.t
 *
 * @param {Object} [row]   A report row, which is `undefined` while the report loads.
 * @param {number} [index] The index of the metric in the row. Defaults to the first metric.
 * @return {number} The metric value, or `0` when it is missing or not a number.
 */
export function getMetricValue( row?: ReportRow, index = 0 ): number {
	return Number( row?.metricValues?.[ index ]?.value ) || 0;
}
