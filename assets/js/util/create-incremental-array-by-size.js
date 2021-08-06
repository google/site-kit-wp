/**
 * Create Incremental Array by Size utility.
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
 * Creates an array of length equal to size with incremental values starting at 0.
 *
 * @since 1.28.0
 *
 * @param {number} size Array length.
 * @return {number[]} Array of incremental numbers.
 * @example createIncrementalArrayBySize(3); // [0, 1, 2]
 */
export const createIncrementalArrayBySize = ( size ) =>
	new Array( size ?? 0 ).fill().map( ( _, i ) => i );
