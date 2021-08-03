/**
 * String to Date utility.
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

/**
 * Internal dependencies
 */
import { INVALID_DATE_STRING_ERROR } from './constants';
import { isValidDateString } from './is-valid-date-string';

/**
 * Converts a valid date string to a Date instance.
 *
 * @since 1.38.0
 *
 * @param {string} dateString The date string to parse.
 * @return {Date} Date instance.
 */
export const stringToDate = ( dateString ) => {
	invariant( isValidDateString( dateString ), INVALID_DATE_STRING_ERROR );

	/**
	 * Split date into explicit parts rather than pass directly into date constructor
	 * to avoid timezone issues caused by parsing as UTC. Ensures date is accurate for
	 * the user's local time, otherwise has a chance to return a different day than was
	 * passed in depending on timezone.
	 */
	const [ year, month, day ] = dateString.split( '-' );

	return new Date( year, month - 1, day );
};
