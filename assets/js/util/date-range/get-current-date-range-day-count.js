/**
 * `getCurrentDateRangeDayCount` utility.
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
 * Gets the current dateRange day count.
 *
 * @since 1.19.0
 * @since 1.26.0 `dateRange` is now a required argument.
 *
 * @param {string} dateRange The date range slug.
 * @return {number} The number of days in the range.
 */
export function getCurrentDateRangeDayCount( dateRange ) {
	const daysMatch = dateRange.match( /last-(\d+)-days/ );

	if ( daysMatch && daysMatch[ 1 ] ) {
		return parseInt( daysMatch[ 1 ], 10 );
	}

	throw new Error( 'Unrecognized date range slug.' );
}
