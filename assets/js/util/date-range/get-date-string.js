/**
 * `getDateString` utility.
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
import { INVALID_DATE_INSTANCE_ERROR } from './constants';
import { isValidDateInstance } from './is-valid-date-instance';

/**
 * Parses the given Date instance and returns a date string (YYYY-MM-DD).
 *
 * @since 1.18.0
 *
 * @param {string|number|Date} date Date to parse into a string. Must be valid date value to be passed into Date constructor.
 * @return {string}                 The parsed date string (YYYY-MM-DD).
 */
export const getDateString = ( date ) => {
	const dateInstance = new Date( date );
	invariant( isValidDateInstance( dateInstance ), INVALID_DATE_INSTANCE_ERROR );

	const month = `${ dateInstance.getMonth() + 1 }`;
	const day = `${ dateInstance.getDate() }`;
	const year = dateInstance.getFullYear();

	return [
		year,
		month.length < 2 ? `0${ month }` : month,
		day.length < 2 ? `0${ day }` : day,
	].join( '-' );
};
