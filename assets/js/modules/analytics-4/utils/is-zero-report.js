/**
 * Report utilities.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * Checks whether the report data has only zero values.
 *
 * @since 1.95.0
 *
 * @param {Object} report Report data object.
 * @return {(boolean|undefined)} Returns TRUE if the report data is empty or has only zero values, FALSE if there is at least one non-zero value, or undefined if the report data is not resolved yet.
 */
export function isZeroReport( report ) {
	if ( report === undefined ) {
		return undefined;
	}

	// If there is no rows array, no totals array, the totals row is zero keyed
	// object (RE: #8442), or totals is an array of empty objects, this is an
	// empty report.
	if (
		! report?.rows ||
		! report?.totals ||
		Object.values( report?.totals )?.every?.( isEmpty )
	) {
		return true;
	}

	// false means there _is_ some report data
	return ! report.totals.some( ( totals ) => {
		if ( ! totals.metricValues ) {
			return false;
		}

		return totals.metricValues.some( ( { value } ) => value > 0 );
	} );
}
