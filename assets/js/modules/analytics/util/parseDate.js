/**
 * convertDateStringToDateObject utility.
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
 * Converts a string date into an Date object and accounts for differences in timezones.
 *
 * @param {string} dateString String representing the date in the format of YYYYMMDD
 * @return {Date} Objet representing the date passed.
 */
const parseDate = ( dateString ) => {
	if ( dateString.match( /[0-9]{8}/ ) ) {
		const year = dateString.slice( 0, 4 );
		const monthIndex = Number( dateString.slice( 4, 6 ) ) - 1;
		const day = dateString.slice( 6, 8 );
		return new Date( year, monthIndex.toString(), day );
	}
	return false;
};

export default parseDate;
