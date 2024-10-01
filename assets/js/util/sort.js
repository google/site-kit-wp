/**
 * Sorting functions.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Sorts the provided list in a case-insensitive manner.
 *
 * @since n.e.x.t
 *
 * @param {Array}  listToSort The list to sort (Array of objects or arrays).
 * @param {string} orderBy    The field by which the list should be ordered.
 * @return {Array} The sorted list.
 */
export function caseInsensitiveListSort( listToSort, orderBy ) {
	return listToSort.sort( ( a, b ) => {
		const nameA = a[ orderBy ]?.toLowerCase() || '';
		const nameB = b[ orderBy ]?.toLowerCase() || '';

		return nameA.localeCompare( nameB );
	} );
}
