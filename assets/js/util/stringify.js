/**
 * Stringify function.
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
import md5 from 'md5';

/**
 * Transforms an object into a hash string.
 *
 * This function can be used to e.g. generate cache keys, based on the given
 * object. Object properties are sorted, so even if they are provided in
 * different order, the hash will match. The function furthermore supports
 * nested objects.
 *
 * @since 1.7.0
 *
 * @param {Object} obj The object to stringify.
 * @return {string} Hash for the object.
 */
export const stringifyObject = ( obj ) => {
	return md5( JSON.stringify( sortObjectProperties( obj ) ) );
};

function sortObjectProperties( obj ) {
	const orderedData = {};
	Object.keys( obj ).sort().forEach( ( key ) => {
		let val = obj[ key ];
		if ( val && 'object' === typeof val && ! Array.isArray( val ) ) {
			val = sortObjectProperties( val );
		}
		orderedData[ key ] = val;
	} );
	return orderedData;
}
