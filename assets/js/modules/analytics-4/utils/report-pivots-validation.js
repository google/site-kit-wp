/**
 * Analytics 4 pivot reporting API validation utilities.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { isValidOrders } from './report-validation';

/**
 * Verifies that pivot definitions are valid for a report. It should be an array
 * of objects where each object has a "fieldNames" property, a "limit" property
 * and an optional "orderby" property. The "orderby" property should be a valid
 * order definition using the `isValidOrders` function.
 *
 * @since 1.130.0
 *
 * @param {Object[]} pivots The pivots object to check.
 * @return {boolean} TRUE if pivot definitions are valid, otherwise FALSE.
 */
export function isValidPivotsObject( pivots ) {
	if ( ! Array.isArray( pivots ) ) {
		return false;
	}

	return pivots.every( ( pivot ) => {
		if ( ! isPlainObject( pivot ) ) {
			return false;
		}

		if (
			! pivot.hasOwnProperty( 'fieldNames' ) ||
			! Array.isArray( pivot.fieldNames ) ||
			pivot.fieldNames.length === 0
		) {
			return false;
		}

		if (
			! pivot.hasOwnProperty( 'limit' ) ||
			typeof pivot.limit !== 'number'
		) {
			return false;
		}

		if (
			pivot.hasOwnProperty( 'orderby' ) &&
			! isValidOrders( pivot.orderby )
		) {
			return false;
		}

		return true;
	} );
}
