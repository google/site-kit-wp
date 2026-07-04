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
 * Checks the given value to see if it is a positive integer.
 *
 * @since 1.11.0 Function introduced.
 * @since 1.90.0 Moved outside Tag Manager to a generic utility function.
 *
 * @param {*} input Value to check.
 * @return {boolean} Validity.
 */
export function isValidNumericID( input ) {
	const id = parseFloat( input ) || 0;

	if ( ! Number.isInteger( id ) ) {
		return false;
	}

	return id > 0;
}
