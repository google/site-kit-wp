/**
 * Analytics 4 reporting API validation utilities.
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
import { isPlainObject } from 'lodash';

/**
 * Internal dependencies
 */
import { isValidStringsOrObjects } from '../../../util/report-validation';

/**
 * Verifies that provided metrics match allowed values. Metrics can be a string,
 * an array of string, an array of objects or mix of strings and objects. Objects
 * must have a valid "name" property in order to be considered as valid, and they
 * can optionally include an "expression" property.
 *
 * A valid metric name is a string matching the regular expression /^[a-zA-Z0-9_]+$/.
 *
 * @since 1.94.0
 * @since n.e.x.t Added a regular expression to validate metric names, in keeping with the Google API.
 *
 * @param {string|string[]|Object|Object[]} metrics The metrics to check.
 * @return {boolean} TRUE if metrics are valid, otherwise FALSE.
 */
export function isValidMetrics( metrics ) {
	const isValidName = ( metricName ) =>
		typeof metricName === 'string' && /^[a-zA-Z0-9_]+$/.test( metricName );

	if ( typeof metrics === 'string' ) {
		const metricNames = metrics.split( ',' );
		return metricNames.every( isValidName );
	}

	return isValidStringsOrObjects( metrics, ( metric ) => {
		const validName =
			metric.hasOwnProperty( 'name' ) && isValidName( metric.name );

		// 'expression' is optional; if provided, it must be a string.
		const validExpression =
			! metric.hasOwnProperty( 'expression' ) ||
			typeof metric.expression === 'string';
		return validName && validExpression;
	} );
}

/**
 * Verifies provided dimensions to make sure it matches allowed values. It can be a string,
 * array of strings, an object with "name" field, array of such objects or an array of strings
 * and objects.
 *
 * @since 1.94.0
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
 * @since 1.94.0
 *
 * @param {Object} dimensionFilters The dimension filters to check.
 * @return {boolean} TRUE if dimension filters are valid, otherwise FALSE.
 */
export function isValidDimensionFilters( dimensionFilters ) {
	// Ensure every dimensionFilter key corresponds to a valid dimension.
	const validType = [ 'string' ];
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

/**
 * Verifies that order definitions are valid for a report. It should be an array
 * of objects where each object has either a "metric" or a "dimension" property,
 * and an optional "desc" property. The "metric" and "dimension" properties should
 * be objects with "metricName" and "dimensionName" properties respectively.
 *
 * @since 1.95.0
 *
 * @param {Object[]} orders The order definitions to check.
 * @return {boolean} TRUE if order definitions are valid, otherwise FALSE.
 */
export function isValidOrders( orders ) {
	if ( ! Array.isArray( orders ) ) {
		return false;
	}

	return orders.every( ( order ) => {
		if ( ! isPlainObject( order ) ) {
			return false;
		}

		if (
			order.hasOwnProperty( 'desc' ) &&
			typeof order.desc !== 'boolean'
		) {
			return false;
		}

		if ( order.metric ) {
			return (
				! order.dimension &&
				typeof order.metric?.metricName === 'string'
			);
		}

		if ( order.dimension ) {
			return typeof order.dimension?.dimensionName === 'string';
		}

		return false;
	} );
}
