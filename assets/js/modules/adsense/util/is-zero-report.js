/**
 * Report utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Checks whether the report data is empty or not.
 *
 * @since n.e.x.t
 *
 * @param {Object} report Report data.
 * @return {boolean} TRUE if the report has no data, otherwise FALSE.
 */
export function isZeroReport( report ) {
	if ( typeof report === 'undefined' ) {
		return true;
	}

	const { rows, totals } = report || {};
	if ( ! rows || ! totals ) {
		return true;
	}

	if ( rows && ( ! Array.isArray( rows ) || ! rows.length ) ) {
		return true;
	}

	if ( totals && ( ! Array.isArray( totals ) || ! totals.length ) ) {
		return true;
	}

	if ( ! totals.some( ( total ) => total > 0 ) ) {
		return true;
	}

	return false;
}
