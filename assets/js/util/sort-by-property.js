/**
 * `sortByProperty` utility function.
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
 * Sorts an array of objects based on numeric order/priority key.
 *
 * @since 1.13.0
 *
 * @param {Array}  arrayData Array containing objects to be sorted.
 * @param {string} property  The object key to use for matching.
 * @return {Array} An Array containing objects ordered by the priority key.
 */
export function sortByProperty( arrayData, property ) {
	return arrayData.sort( ( objectA, objectB ) => {
		if ( objectA[ property ] > objectB[ property ] ) {
			return 1;
		}
		if ( objectA[ property ] < objectB[ property ] ) {
			return -1;
		}
		return 0;
	} );
}
