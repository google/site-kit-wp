/**
 * Report args utils.
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
 * External dependencies
 */
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

// Constants relevant to the special formatting of the arguments URL segment.
const SLASH_ENCODED = encodeURIComponent( '/' );
const SLASH_ARGS_ENCODED = SLASH_ENCODED.replace( '%', '~' );

/**
 * Encodes an individual value of a report args key/value pair.
 *
 * Uses string.replace internally with RegExp as string.replaceAll
 * is not yet supported in Node and some browsers.
 *
 * @since 1.22.0
 *
 * @param {*} value Raw argument value.
 * @return {string} Encoded value.
 */
const encodeValue = ( value ) => {
	return encodeURIComponent( value ).replace(
		new RegExp( SLASH_ENCODED, 'g' ),
		SLASH_ARGS_ENCODED
	);
};

/**
 * Converts an object of report arguments into the special URL segment format.
 *
 * @since 1.22.0
 *
 * @param {Object} reportArgs Object of arguments to convert. Values should not be URL encoded.
 * @return {string} Formatted URL segment.
 */
export const reportArgsToURLSegment = ( reportArgs ) => {
	invariant(
		isPlainObject( reportArgs ),
		'report args must be a plain object'
	);

	return Object.entries( reportArgs )
		.filter( ( [ , value ] ) => value !== undefined )
		.map( ( [ key, value ] ) => `${ key }=${ encodeValue( value ) }` )
		.join( '&' );
};
