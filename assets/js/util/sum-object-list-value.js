/**
 * Utility function sumObjectListValue.
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
 * External dependencies
 */
import { sumBy } from 'lodash';

/**
 * Returns the sum of a given fieldName in a list.
 *
 * @since 1.21.0
 *
 * @param {Array}  list      Array of objects or arrays.
 * @param {string} fieldName The path name to the field to be summed.
 * @return {number} The sum of all fields in the list.
 */
export default function sumObjectListValue( list, fieldName ) {
	return sumBy( list, fieldName ) || 0;
}
