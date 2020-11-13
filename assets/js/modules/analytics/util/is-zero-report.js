/**
 * Report utilities.
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
 * Checks whether the report data is empty or not.
 *
 * @since n.e.x.t
 *
 * @param {Object} report Report data object.
 * @return {boolean | undefined} Returns undefined if in the loading state, TRUE if the report has no data or missing data, otherwise FALSE.
 */
export function isZeroReport( report ) {
	if ( report === undefined ) {
		return undefined;
	}

	if ( report?.[ 0 ]?.data?.rows === undefined || report?.[ 0 ]?.data?.rows?.length === 0 || report?.[ 0 ]?.data?.totals?.[ 0 ] === undefined || report?.[ 0 ]?.data?.totals?.[ 0 ].length === 0 ) {
		return true;
	}

	// Sum all values in all totals objects
	const totals = report[ 0 ].data.totals;
	let sumOfTotals = 0;
	for ( let i = 0; i < totals.length; i++ ) {
		const values = totals[ i ].values;
		for ( let j = 0; j < values.length; j++ ) {
			sumOfTotals += parseInt( values[ j ] );
		}
	}
	if ( sumOfTotals === 0 ) {
		return true;
	}

	if ( typeof report !== 'object' ) {
		// false means there _is_ data
		return true;
	}

	return false;
}
