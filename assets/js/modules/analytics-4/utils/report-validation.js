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

/* eslint complexity: [ "error", 17 ] */

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
 * an array of string, an array of objects or mix of strings and objects.
 * Objects must have a "name" property that matches the regex `/^[a-zA-Z0-9_]+$/`
 * to be valid. Objects can optionally include an "expression" property.
 *
 * When a single string is provided, it must be a metric name or a comma-separated
 * list of metric names.
 *
 * A metric name must match the regular expression `/^[a-zA-Z0-9_]+$/`.
 *
 * @since 1.94.0
 * @since 1.98.0 Added a regular expression to validate metric names, in keeping with the GA4 API.
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

	return isValidStringsOrObjects(
		metrics,
		( metric ) => {
			const validName =
				metric.hasOwnProperty( 'name' ) && isValidName( metric.name );

			// 'expression' is optional, so if it wasn't provided, we can
			// return early.
			if ( ! metric.hasOwnProperty( 'expression' ) ) {
				return validName;
			}

			// 'expression', if provided, must be a string.
			const validExpression = typeof metric.expression === 'string';

			return validName && validExpression;
		},
		isValidName
	);
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
 * @param {Object} filters The dimension filters to check.
 * @return {boolean} TRUE if dimension filters are valid, otherwise FALSE.
 */
export function isValidDimensionFilters( filters ) {
	// Ensure every dimensionFilter key corresponds to a valid dimension.
	const validType = [ 'string' ];
	return Object.keys( filters ).every( ( dimension ) => {
		if ( validType.includes( typeof filters[ dimension ] ) ) {
			return true;
		}

		if ( Array.isArray( filters[ dimension ] ) ) {
			return filters[ dimension ].every( ( param ) =>
				validType.includes( typeof param )
			);
		}

		if ( isPlainObject( filters[ dimension ] ) ) {
			const props = Object.keys( filters[ dimension ] );

			if ( ! props.includes( 'filterType' ) ) {
				return false;
			}

			if (
				filters[ dimension ].filterType !== 'emptyFilter' &&
				! props.includes( 'value' )
			) {
				return false;
			}

			return true;
		}

		return false;
	} );
}

/**
 * Verifies provided metricFilters to make sure they match allowed values found in metrics and supported filters.
 *
 * @since 1.111.0
 *
 * @param {Object} filters The metric filters to check.
 * @return {boolean} TRUE if dimension filters are valid, otherwise FALSE.
 */
export function isValidMetricFilters( filters ) {
	const validType = [ 'string' ];
	const allowedFilterTypes = [ 'numericFilter', 'betweenFilter' ];

	return Object.values( filters ).every( ( filter ) => {
		if ( validType.includes( typeof filter ) ) {
			return true;
		}

		if ( Array.isArray( filter ) ) {
			return filter.every( ( param ) =>
				validType.includes( typeof param )
			);
		}

		if ( ! isPlainObject( filter ) ) {
			return false;
		}

		const { filterType, value, fromValue, toValue } = filter;

		// Validate filterType if present
		if ( filterType && ! allowedFilterTypes.includes( filterType ) ) {
			return false;
		}

		const props = Object.keys( filter );

		// Numeric Filter (default if filterType is missing)
		if ( ! filterType || filterType === 'numericFilter' ) {
			return (
				props.includes( 'operation' ) &&
				props.includes( 'value' ) &&
				( ! isPlainObject( value ) || 'int64Value' in value )
			);
		}

		// Between Filter
		if ( filterType === 'betweenFilter' ) {
			return (
				props.includes( 'fromValue' ) &&
				props.includes( 'toValue' ) &&
				[ fromValue, toValue ].every(
					( val ) => ! isPlainObject( val ) || 'int64Value' in val
				)
			);
		}

		return false;
	} );
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
