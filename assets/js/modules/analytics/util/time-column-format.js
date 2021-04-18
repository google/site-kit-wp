/**
 * Tag matching patterns.
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
 * Gets time format for vAxis of a chart based on the incoming data.
 *
 * @since 1.30.0
 *
 * @param {Array.<Object>} dataMap      Data array for a chart.
 * @param {number}         selectedStat Selected stat number.
 * @return {string} Time format.
 */
export function getTimeColumnVaxisFormat( dataMap, selectedStat ) {
	// Use a format including hours if any of the rows have a non-zero number of hours.
	for ( let i = 1; i < dataMap.length; i++ ) {
		// dataMap[ i ] is the row (skipping `0` for headers)
		// selectedStat is the column index, and `0` for number of hours.
		if ( dataMap[ i ]?.[ selectedStat ]?.[ 0 ] ) {
			// Here we use the 24hr time format for hours so that
			// it starts at zero since we're representing a duration.
			return 'HH:mm:ss';
		}
	}

	return 'mm:ss';
}
