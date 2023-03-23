/**
 * User Input Validation Utilities.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Returns a boolean indicating whether the given answer has an error.
 *
 * @since 1.92.0
 *
 * @param {string[]} values Array of values to validate.
 * @return {boolean} True if the answer has an error, false otherwise.
 */
export function hasErrorForAnswer( values ) {
	return values.length === 0;
}

/**
 * Returns an error message for the given answer, or null if the answer is valid.
 *
 * @since 1.92.0
 *
 * @param {string[]} values Array of values to validate.
 * @param {number}   [max]  Maximum number of values allowed. Defaults to 1.
 * @return {string|null} Error message, or null if the answer is valid.
 */
export function getErrorMessageForAnswer( values, max = 1 ) {
	if ( values.length === 0 ) {
		return max === 1
			? __( 'Please select an answer', 'google-site-kit' )
			: __( 'Please select at least 1 answer', 'google-site-kit' );
	}

	return null;
}
