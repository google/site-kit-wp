/**
 * Reporting API validation utilities.
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
 * Internal dependencies
 */
import { isValidStringsOrObjects } from '../../../util/report-validation';

/**
 * Verifies that provided metrics match allowed values. Metrics can be a string,
 * an array of string, an array of objects or mix of strings and objects. Objects
 * must have an "expression" property in order to be considered as valid, and they
 * can optionally include an "alias" property.
 *
 * @since 1.13.0
 *
 * @param {string|string[]|Object|Object[]} metrics The metrics to check.
 * @return {boolean} TRUE if metrics are valid, otherwise FALSE.
 */
export function isValidMetrics( metrics ) {
	return isValidStringsOrObjects( metrics, ( metric ) => {
		const validExpression =
			metric.hasOwnProperty( 'expression' ) &&
			typeof metric.expression === 'string';

		// 'alias' is optional; if provided, it must be a string.
		const validAlias =
			! metric.hasOwnProperty( 'alias' ) ||
			typeof metric.alias === 'string';
		return validExpression && validAlias;
	} );
}

/**
 * Verifies provided dimensions to make sure it matches allowed values. It can be a string,
 * array of strings, an object with "name" field, array of such objects or an array of strings
 * and objects.
 *
 * @since 1.13.0
 *
 * @param {string|string[]|Object|Object[]} dimensions The dimensions to check.
 * @return {boolean} TRUE if dimensions are valid, otherwise FALSE.
 */
export function isValidDimensions( dimensions ) {
	return isValidStringsOrObjects( dimensions, ( dimension ) => {
		return (
			dimension.hasOwnProperty( 'name' ) &&
			typeof dimension.name === 'string'
		);
	} );
}

/**
 * Verifies provided dimensionFilters to make sure they match allowed values found in dimensions.
 *
 * @since 1.24.0
 *
 * @param {Object} dimensionFilters The dimension filters to check.
 * @return {boolean} TRUE if dimension filters are valid, otherwise FALSE.
 */
export function isValidDimensionFilters( dimensionFilters ) {
	// Ensure every dimensionFilter key corresponds to a valid dimension.
	const validType = [ 'number', 'string' ];
	return Object.keys( dimensionFilters ).every(
		( dimension ) =>
			( validType.includes( typeof dimensionFilters[ dimension ] ) &&
				typeof dimension === 'string' ) ||
			( Array.isArray( dimensionFilters[ dimension ] ) &&
				Object.keys( dimensionFilters[ dimension ] ).every(
					( param ) =>
						validType.includes(
							typeof dimensionFilters[ dimension ][ param ]
						) && validType.includes( typeof param )
				) )
	);
}
