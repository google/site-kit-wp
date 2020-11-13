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
 * External dependencies
 */
import get from 'lodash/get';
import mean from 'lodash/mean';

/**
 * Returns the average of a given fieldName in a list.
 *
 * @since n.e.x.t
 *
 * @param {Array}  list      Array of objects or arrays.
 * @param {string} fieldName The path name of the field to be averaged.
 * @return {number} The average.
 */
export default function averageObjectListValue( list, fieldName ) {
	if ( ! list?.length ) {
		return 0;
	}

	const values = list.map( ( item ) => get( item, fieldName, 0 ) );
	const average = mean( values );

	if ( Number.isInteger( average ) ) {
		return average;
	}

	if ( values.every( Number.isInteger ) ) {
		return Math.round( average );
	}

	return average;
}
