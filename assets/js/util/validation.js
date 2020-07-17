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
 * Verifies that provided metrics match allowed values. Metrics can be a string,
 * an array of string, an array of objects or mix of strings and objects. Objects
 * must have "expression" and "alias" properties in order to be considered as valid.
 *
 * @param {string|string[]|Object[]} metrics The metrics to check.
 * @return {boolean} TRUE if the metrics are valid, otherwise FALSE.
 */
export function isValidMetrics( metrics ) {
	if ( typeof metrics === 'string' ) {
		return true;
	}

	if ( Array.isArray( metrics ) ) {
		for ( let i = 0; i < metrics.length; i++ ) {
			if ( typeof metrics[ i ] === 'string' ) {
				continue;
			}

			if ( typeof metrics[ i ] === 'object' ) {
				const validExpression = metrics[ i ].hasOwnProperty( 'expression' ) && typeof metrics[ i ].expression === 'string';
				const validAlias = metrics[ i ].hasOwnProperty( 'alias' ) && typeof metrics[ i ].alias === 'string';
				if ( validAlias && validExpression ) {
					continue;
				}
			}

			return false;
		}

		return true;
	}

	return false;
}

/**
 * Verifies that either date range or start and end dates are valid.
 *
 * @param {string} dateRange The date range to check.
 * @param {string} startDate The start date to check.
 * @param {string} endDate The end date to check.
 * @return {boolean} TRUE if either date range or start/end dates are valid, otherwise FALSE.
 */
export function isValidDateRange( dateRange, startDate, endDate ) {
	const validStartDate = startDate && startDate.match( /^\d{4}-\d{2}-\d{2}$/ );
	const validEndDate = endDate && endDate.match( /^\d{4}-\d{2}-\d{2}$/ );
	const validDateRange = dateRange && dateRange.match( /^last-\d+-days$/i );

	return ( validStartDate && validEndDate ) || validDateRange;
}

/**
 * Verifies that order definitions are valid. It can be either an object or an array
 * of objects where each object has "fieldName" and valid "sortOrder" properties.
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
		for ( let i = 0; i < orders.length; i++ ) {
			if ( typeof orders[ i ] !== 'object' || ! isValidOrder( orders[ i ] ) ) {
				return false;
			}
		}

		return true;
	}

	if ( typeof orders === 'object' ) {
		return isValidOrder( orders );
	}

	return false;
}
