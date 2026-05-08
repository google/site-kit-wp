/**
 * Utility function related to checking if a given value is numeric.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Checks if a given value is numeric.
 *
 * @since 1.80.0
 *
 * @param {*} value The value to check.
 * @return {boolean} TRUE if a value is numeric FALSE otherwise.
 */
export function isNumeric( value ) {
	if ( typeof value === 'number' ) {
		return true;
	}

	const string = ( value || '' ).toString();

	if ( ! string ) {
		return false;
	}

	return ! isNaN( string );
}
