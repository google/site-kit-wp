/**
 * Analytics 4 reporting API validation utilities.
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
 * Internal dependencies
 */
import { isValidStringsOrObjects } from '../../../util/report-validation';

/**
 * Verifies that provided metrics match allowed values. Metrics can be a string,
 * an array of string, an array of objects or mix of strings and objects. Objects
 * must have an "expression" property in order to be considered as valid, and they
 * can optionally include an "name" property.
 *
 * @since n.e.x.t
 *
 * @param {string|string[]|Object|Object[]} metrics The metrics to check.
 * @return {boolean} TRUE if metrics are valid, otherwise FALSE.
 */
export function isValidMetrics( metrics ) {
	return isValidStringsOrObjects( metrics, ( metric ) => {
		const validExpression = metric.hasOwnProperty( 'expression' ) && typeof metric.expression === 'string';

		// 'name' is optional; if provided, it must be a string.
		const validName = ! metric.hasOwnProperty( 'name' ) || typeof metric.name === 'string';
		return validExpression && validName;
	} );
}
