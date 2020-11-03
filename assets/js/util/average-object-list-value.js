/**
 * Utility function averageObjectListValue
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
import sumObjectListValue from './sum-object-list-value.js';

/**
 * Returns the average of a given fieldName in a list.
 *
 * @since n.e.x.t
 *
 * @param {Array}  list      Array of objects or arrays.
 * @param {string} fieldName The name of the field to be averaged.
 *
 * @return {number} The average.
 */
export default function averageObjectListValue( list, fieldName ) {
	// Filter the list to remove any entries that don't have fieldName so our length is correct for division.
	const filteredList = list.filter( ( item ) => {
		return Object.keys( item ).includes( fieldName );
	} );

	const allIntegers = filteredList.every( ( item ) => {
		return Number.isInteger( item[ fieldName ] );
	} );

	// Ensure that we don't divide empty arrays by 0.
	const average = filteredList.length ? sumObjectListValue( list, fieldName ) / filteredList.length : 0;

	if ( average > 0 && allIntegers ) {
		return Math.round( average );
	}

	return average;
}
