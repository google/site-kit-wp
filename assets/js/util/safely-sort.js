/**
 * `safelySort` utility function.
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
 * Sorts an array without causing the mutation if the given parameter is an array.
 * If the parameter is not an array, it returns the parameter as is.
 *
 * @since 1.110.0
 * @since n.e.x.t Moved to the common utility directory from the key metrics directory.
 *
 * @param {Array|*} arr Param to be sorted.
 * @return {Array|*} 	Safely sorted array without mutation.
 */
export const safelySort = ( arr ) => {
	return Array.isArray( arr ) ? [ ...arr ].sort() : arr;
};
