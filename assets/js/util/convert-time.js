/**
 * Time related utility functions.
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
 * Converts seconds into an array with the following values [HH, MM, SS, MS] as described below.
 * HH: hours.
 * MM: minutes.
 * SS: seconds.
 * MS: milliseconds.
 *
 * For example, passing 196.385 returns [ 0, 3, 16, 385 ].
 *
 * @since 1.27.0
 *
 * @param {number} seconds The number of seconds.
 * @return {Array} Array containing the hours, minutes, seconds and milliseconds.
 */
export const convertSecondsToArray = ( seconds ) => {
	seconds = parseFloat( seconds );

	if ( isNaN( seconds ) || 0 === seconds ) {
		return [ 0, 0, 0, 0 ];
	}

	return [
		Math.floor( seconds / 60 / 60 ),
		Math.floor( ( seconds / 60 ) % 60 ),
		Math.floor( seconds % 60 ),
		Math.floor( seconds * 1000 ) - Math.floor( seconds ) * 1000,
	];
};

/**
 * Converts seconds into an array with the following values [HH, MM, SS, MS] as described below.
 *
 * For example, passing "2014-10-02T15:01:23Z" returns 1412262083000.
 *
 * @since n.e.x.t
 *
 * @param {string} dateStringValue The date time string.
 * @return {number} UNIX timestamp in milliseconds.
 */
export const convertDateStringToUNIXTimestamp = ( dateStringValue ) => {
	const unixTimestamp =
		dateStringValue && ! Number.isInteger( dateStringValue )
			? new Date( dateStringValue ).getTime()
			: dateStringValue;

	return unixTimestamp;
};
