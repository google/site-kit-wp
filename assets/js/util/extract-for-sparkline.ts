/**
 * Utility function extractForSparkline.
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
import { get } from 'lodash';

/**
 * Extracts a single column of data for a sparkline from a dataset prepared for Google charts.
 *
 * @since 1.0.0
 *
 * @param {Array}           rowData       An array of Google charts row data.
 * @param {(number|string)} column        The path to the property of an individual row for the y-axis value.
 * @param {(number|string)} [indexColumn] Optional. The path to the property of an individual row for the x-axis value.
 * @return {Array} Extracted column of dataset prepared for Google charts.
 */
export default function extractForSparkline(
	rowData: any[],
	column: number | string,
	indexColumn = 0
): any[] {
	return rowData.map( ( row, i ) => {
		return [
			get( row, indexColumn ), // row[0] always contains the x axis value (typically date).
			get( row, column, 0 === i ? '' : 0 ), // the data for the sparkline.
		];
	} );
}
