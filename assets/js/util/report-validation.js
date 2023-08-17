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
 * Validates data that can be either string or object of the certain type, or array of them.
 *
 * @since 1.13.0
 * @since 1.98.0 Added verifyStringFunction parameter.
 *
 * @param {string|string[]|Object|Object[]} data                   The data to check.
 * @param {Function}                        verifyObjectFunction   The callback to verify an object.
 * @param {Function}                        [verifyStringFunction] The callback to verify a string (optional).
 * @return {boolean} TRUE if data is valid, otherwise FALSE.
 */
export function isValidStringsOrObjects(
	data,
	verifyObjectFunction,
	verifyStringFunction = () => true
) {
	if ( typeof data === 'string' ) {
		return verifyStringFunction( data );
	}

	if ( typeof data === 'object' && verifyObjectFunction( data ) ) {
		return true;
	}

	if ( Array.isArray( data ) ) {
		return data.every( ( item ) => {
			if ( typeof item === 'string' ) {
				return verifyStringFunction( item );
			}

			if ( typeof item === 'object' ) {
				return verifyObjectFunction( item );
			}

			return false;
		} );
	}

	// Arguably this should fail/throw, because none of our allowed types were encountered.
	return false;
}

/**
 * Verifies that either date range or start and end dates are valid.
 *
 * @since 1.13.0
 *
 * @param {Object} dates           The object containing dates to check.
 * @param {string} dates.startDate The start date to check.
 * @param {string} dates.endDate   The end date to check.
 * @return {boolean} TRUE if either date range or start/end dates are valid, otherwise FALSE.
 */
export function isValidDateRange( { startDate, endDate } ) {
	const validStartDate =
		startDate && startDate.match( /^\d{4}-\d{2}-\d{2}$/ );
	const validEndDate = endDate && endDate.match( /^\d{4}-\d{2}-\d{2}$/ );

	return validStartDate && validEndDate;
}

/**
 * Verifies that order definitions are valid. It can be either an object or an array
 * of objects where each object has "fieldName" and valid "sortOrder" properties.
 *
 * @since 1.13.0
 *
 * @param {Object|Object[]} orders The order definitions to check.
 * @return {boolean} TRUE if order definitions are valid, otherwise FALSE.
 */
export function isValidOrders( orders ) {
	const isValidOrder = ( order ) => {
		const isValidFieldName =
			order.hasOwnProperty( 'fieldName' ) && !! order.fieldName;
		const isValidSortOrder =
			order.hasOwnProperty( 'sortOrder' ) &&
			/(ASCENDING|DESCENDING)/i.test( order.sortOrder.toString() );
		return isValidFieldName && isValidSortOrder;
	};

	if ( Array.isArray( orders ) ) {
		return orders.every(
			( item ) => typeof item === 'object' && isValidOrder( item )
		);
	}

	if ( typeof orders === 'object' ) {
		return isValidOrder( orders );
	}

	// Arguably this should fail/throw, because none of our allowed types were encountered.
	return false;
}

/**
 * Verifies that provided parameter is either a string or an array of strings.
 *
 * @since 1.15.0
 *
 * @param {(string|Array.<string>)} items Items to validate.
 * @return {boolean} TRUE if items are either a string or an array of strings, otherwise FALSE.
 */
export function isValidStringularItems( items ) {
	if ( typeof items === 'string' ) {
		return true;
	}

	if ( Array.isArray( items ) ) {
		return items.every( ( item ) => typeof item === 'string' );
	}

	return false;
}
