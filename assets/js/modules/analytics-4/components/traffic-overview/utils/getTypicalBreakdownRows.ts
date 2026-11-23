/**
 * Typical Traffic Overview breakdown row shaping.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { sum, sumBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	TrafficBreakdownRow,
	formatRoundedShare,
	getRoundedShares,
} from './getBreakdownRows';

export interface TrafficBreakdownValue {
	/** The dimension value, such as `Organic Search`. */
	label: string;
	/** The visits the value had. */
	visits: number;
}

/**
 * Shapes the values of a breakdown column into the rows the column renders.
 *
 * The values cover the selected range only and arrive ordered by visits, so
 * the rows are taken as they come. Values with no visits are left out first.
 * When more than `maxRows` values have visits, the top values fill
 * every row except the last, and an "Others" row adds up the rest. The
 * displayed shares add up to exactly 100%, only a lone value shows 100%, and a
 * row with visits that gets no whole percent is displayed as `<1%` rather
 * than `0%`.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} [values]  Optional. The column's values, ordered by visits, most first.
 * @param {number}        [maxRows] Optional. The most rows to return, counting the trailing "Others" row. Default `TRAFFIC_BREAKDOWN_MAX_ROWS`.
 * @return {Array<Object>} The rows to render, empty when no value has visits.
 */
export function getTypicalBreakdownRows(
	values: TrafficBreakdownValue[] = [],
	maxRows = TRAFFIC_BREAKDOWN_MAX_ROWS
): TrafficBreakdownRow[] {
	// Values with no visits are left out before the cap, so none of them takes
	// a row.
	const valueRows = values.filter( ( { visits } ) => visits > 0 );

	if ( ! valueRows.length ) {
		return [];
	}

	// One slot is kept for the trailing "Others" row.
	const shapedRows =
		valueRows.length <= maxRows
			? valueRows
			: [
					...valueRows.slice( 0, maxRows - 1 ),
					{
						label: __( 'Others', 'google-site-kit' ),
						visits: sumBy(
							valueRows.slice( maxRows - 1 ),
							'visits'
						),
					},
			  ];

	const visitCounts = shapedRows.map( ( { visits } ) => visits );
	const total = sum( visitCounts );
	const wholePercentages = getRoundedShares( visitCounts, 100 );

	return shapedRows.map( ( { label, visits }, index ) => ( {
		label,
		percentage: visits / total,
		formattedPercentage: formatRoundedShare(
			wholePercentages[ index ],
			100
		),
	} ) );
}
