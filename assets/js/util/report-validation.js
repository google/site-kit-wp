/**
 * Reporting API validation utilities.
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
 * Validates data that can be either string or object of the certain type, or array of them.
 *
 * @since n.e.x.t
 *
 * @param {string|string[]|Object|Object[]} data The data to check.
 * @param {Function} verifyFunction The callback to verify an object.
 * @return {boolean} TRUE if data is valid, otherwise FALSE.
 */
function isValidStringsOrObjects( data, verifyFunction ) {
	if ( typeof data === 'string' ) {
		return true;
	}

	if ( typeof data === 'object' && verifyFunction( data ) ) {
		return true;
	}

	if ( Array.isArray( data ) ) {
		return data.every( ( item ) => typeof item === 'string' || ( typeof item === 'object' && verifyFunction( item ) ) );
	}

	// Arguably this should fail/throw, because none of our allowed types were encountered.
	return false;
}

/**
 * Verifies that provided metrics match allowed values. Metrics can be a string,
 * an array of string, an array of objects or mix of strings and objects. Objects
 * must have "expression" and "alias" properties in order to be considered as valid.
 *
 * @since n.e.x.t
 *
 * @param {string|string[]|Object|Object[]} metrics The metrics to check.
 * @return {boolean} TRUE if metrics are valid, otherwise FALSE.
 */
export function isValidMetrics( metrics ) {
	return isValidStringsOrObjects( metrics, ( metric ) => {
		const validExpression = metric.hasOwnProperty( 'expression' ) && typeof metric.expression === 'string';
		const validAlias = metric.hasOwnProperty( 'alias' ) && typeof metric.alias === 'string';
		return validExpression && validAlias;
	} );
}

/**
 * Verifies provided dimensions to make sure it matches allowed values. It can be a string,
 * array of strings, an object with "name" field, array of such objects or an array of strings
 * and objects.
 *
 * @since n.e.x.t
 *
 * @param {string|string[]|Object|Object[]} dimensions The dimensions to check.
 * @return {boolean} TRUE if dimensions are valid, otherwise FALSE.
 */
export function isValidDimensions( dimensions ) {
	return isValidStringsOrObjects( dimensions, ( dimension ) => {
		return dimension.hasOwnProperty( 'name' ) && typeof dimension.name === 'string';
	} );
}

/**
 * Verifies that either date range or start and end dates are valid.
 *
 * @since n.e.x.t
 *
 * @param {string} dateRange The date range to check.
 * @param {string} startDate The start date to check.
 * @param {string} endDate The end date to check.
 * @return {boolean} TRUE if either date range or start/end dates are valid, otherwise FALSE.
 */
export function isValidDateRange( dateRange, startDate, endDate ) {
	const validStartDate = startDate && startDate.match( /^\d{4}-\d{2}-\d{2}$/ );
	const validEndDate = endDate && endDate.match( /^\d{4}-\d{2}-\d{2}$/ );
	const validDateRange = dateRange && dateRange.match( /^last-\d+-days$/ );

	return ( validStartDate && validEndDate ) || validDateRange;
}

/**
 * Verifies that order definitions are valid. It can be either an object or an array
 * of objects where each object has "fieldName" and valid "sortOrder" properties.
 *
 * @since n.e.x.t
 *
 * @param {Object|Object[]} orders The order definitions to check.
 * @return {boolean} TRUE if order definitions are valid, otherwise FALSE.
 */
export function isValidOrders( orders ) {
	const isValidOrder = ( order ) => {
		const isValidFieldName = order.hasOwnProperty( 'fieldName' ) && !! order.fieldName;
		const isValidSortOrder = order.hasOwnProperty( 'sortOrder' ) && order.sortOrder.toString().match( /(ASCENDING|DESCENDING)/i );
		return isValidFieldName && isValidSortOrder;
	};

	if ( Array.isArray( orders ) ) {
		return orders.every( ( item ) => typeof item === 'object' && isValidOrder( item ) );
	}

	if ( typeof orders === 'object' ) {
		return isValidOrder( orders );
	}

	// Arguably this should fail/throw, because none of our allowed types were encountered.
	return false;
}
