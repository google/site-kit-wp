/**
 * AdSense Settings components.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Returns an AdSense report with zeroed data.
 *
 * @since 1.78.0
 *
 * @param {Object} report AdSense report data.
 * @return {Object} AdSense report data with zeroed data.
 */
export const zeroing = ( report ) => {
	const zeroValue = ( cell ) => ( { ...cell, value: 0 } );

	let clonedReport = { ...report };

	const { totals, rows } = clonedReport;
	const { cells } = totals;

	clonedReport = {
		...clonedReport,
		totals: {
			cells: cells.map( zeroValue ),
		},
		rows: rows.map( ( row ) => ( {
			...row,
			cells: row.cells.map( ( cell, index ) => {
				if ( index !== 0 ) {
					return zeroValue( cell );
				}
				return cell;
			} ),
		} ) ),
	};

	return clonedReport;
};
