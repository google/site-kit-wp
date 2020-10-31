/**
 * Validation utilities.
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
 * Checks the given value to see if it is a positive integer.
 *
 * @since n.e.x.t
 *
 * @param {*} input Value to check.
 * @return {boolean} Validity.
 */
const isValidNumericID = function( input ) {
	const id = parseInt( input, 10 ) || 0;

	return id > 0;
};

/**
 * Checks if the given account ID appears to be a valid Analyics account.
 *
 * @since n.e.x.t
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export { isValidNumericID as isValidAccountID };

/**
 * Checks if the given property ID appears to be valid.
 *
 * @since n.e.x.t
 *
 * @param {(string|number)} propertyID Account ID to test.
 * @return {boolean} Whether or not the given property ID is valid.
 */
export { isValidNumericID as isValidPropertyID };
