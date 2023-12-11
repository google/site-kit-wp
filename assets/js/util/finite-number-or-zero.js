/**
 * Utility function `finiteNumberOrZero()`.
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
import { isFinite } from 'lodash';

/**
 * Returns the passed value if it's a finite number, otherwise returns 0.
 *
 * @since 1.98.0
 *
 * @param {any} value The value to check.
 * @return {number} The finite number `value`, or 0 if `value` is not a finite number.
 */
export const finiteNumberOrZero = ( value ) => {
	return isFinite( value ) ? value : 0;
};
