/**
 * Report utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Checks whether the report data has only zero values.
 *
 * @since 1.22.0
 *
 * @param {Object} report Report data object.
 * @return {(boolean|undefined)} Returns TRUE if the report data has only zero values, FALSE if there is at least one non-zero value, or undefined if the report data is not resolved yet.
 */
export function isZeroReport( report ) {
	if ( report === undefined ) {
		return undefined;
	}

	if (
		! report?.[ 0 ]?.data?.rows?.length ||
		! report?.[ 0 ]?.data?.totals?.[ 0 ]?.values?.length
	) {
		return true;
	}

	// false means there _is_ value report data
	return ! report[ 0 ].data.totals.some( ( totals ) =>
		totals.values.some( ( value ) => value > 0 )
	);
}
