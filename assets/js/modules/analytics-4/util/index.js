/**
 * Analytics utility functions.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export * from './is-zero-report';
// export * from './validation';
// export * from './time-column-format';
// export * from './property';

/**
 * Extracts data required for a pie chart from the Analytics 4 report information.
 *
 * @since n.e.x.t
 *
 * @param {Array}    reports                   The array with reports data.
 * @param {Object}   [options]                 Optional. Data extraction options.
 * @param {number}   [options.keyColumnIndex]  Optional. The number of a column to extract metrics data from.
 * @param {number}   [options.maxSlices]       Optional. Limit the number of slices to display.
 * @param {boolean}  [options.withOthers]      Optional. Whether to add "Others" record to the data map. Only relevant
 *                                             if `maxSlices` is passed. If passed, the final slice will be the
 *                                             "Others" slice, i.e. the number of actual row slices will be
 *                                             `maxSlices - 1`.
 * @param {Function} [options.tooltipCallback] Optional. A callback function for tooltip column values.
 * @return {Array} Extracted data.
 */
export function extractAnalyticsDataForPieChart( reports, options = {} ) {
	const {
		keyColumnIndex = 0,
		maxSlices,
		withOthers = false,
		tooltipCallback,
	} = options;

	const { data = {} } = reports?.[ 0 ] || {};
	const { rows = [], totals = [] } = data;

	const withTooltips = typeof tooltipCallback === 'function';
	const columns = [ 'Source', 'Percent' ];
	if ( withTooltips ) {
		columns.push( {
			type: 'string',
			role: 'tooltip',
			p: {
				html: true,
			},
		} );
	}

	const totalUsers = totals?.[ 0 ]?.values?.[ keyColumnIndex ] || 0;
	const dataMap = [ columns ];

	let hasOthers = withOthers;
	let rowsNumber = rows.length;
	let others = 1;
	if ( maxSlices > 0 ) {
		hasOthers = withOthers && rows.length > maxSlices;
		rowsNumber = Math.min(
			rows.length,
			hasOthers ? maxSlices - 1 : maxSlices
		);
	} else {
		hasOthers = false;
		rowsNumber = rows.length;
	}

	for ( let i = 0; i < rowsNumber; i++ ) {
		const row = rows[ i ];
		const users = row.metrics[ 0 ].values[ keyColumnIndex ];
		const percent = totalUsers > 0 ? users / totalUsers : 0;

		others -= percent;

		const rowData = [ row.dimensions[ 0 ], percent ];
		if ( withTooltips ) {
			rowData.push( tooltipCallback( row, rowData ) );
		}

		dataMap.push( rowData );
	}

	if ( hasOthers && others > 0 ) {
		const rowData = [ __( 'Others', 'google-site-kit' ), others ];
		if ( withTooltips ) {
			rowData.push( tooltipCallback( null, rowData ) );
		}

		dataMap.push( rowData );
	}

	return dataMap;
}
