/**
 * `getPreviousDate` utility.
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
import { getDateString } from './get-date-string';
import { isValidDateString } from './is-valid-date-string';

/**
 * Parses the given date and returns the previous date (daysBefore).
 *
 * @since 1.18.0
 *
 * @param {string} relativeDate Date string (YYYY-MM-DD) to subtract days from.
 * @param {number} daysBefore   Number of days to subtract from relativeDate.
 * @return {string}             The date string (YYYY-MM-DD) for the previous date.
 */
export const getPreviousDate = ( relativeDate = '', daysBefore ) => {
	invariant( isValidDateString( relativeDate ), INVALID_DATE_STRING_ERROR );

	const dateArray = relativeDate.split( '-' );
	/**
	 * Split date into explicit parts rather than pass directly into date constructor
	 * to avoid timezone issues caused by parsing as UTC. Ensures date is accurate for
	 * the user's local time, otherwise has a chance to return a different day than was
	 * passed in depending on timezone.
	 */
	const [ year, month, day ] = dateArray;
	const date = new Date( year, month - 1, day );

	date.setDate( date.getDate() - daysBefore );

	return getDateString( date );
};
