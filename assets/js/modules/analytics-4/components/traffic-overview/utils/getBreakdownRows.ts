/**
 * Traffic Overview breakdown row shaping.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

export interface TrafficBreakdownRow {
	/** The dimension value, exactly as GA4 returned it. */
	label: string;
	/** The row's share of the column's total, as a `0`–`1` fraction. */
	percentage: number;
	/** The row's share as a column displays it, such as `27%` or `<1%`. */
	formattedPercentage: string;
}

const WHOLE_PERCENT_FORMAT = {
	style: 'percent',
	maximumFractionDigits: 0,
} as const;

/**
 * Reads a row's visitor count.
 *
 * @since 1.188.0
 *
 * @param {Object} row A breakdown report row.
 * @return {number} The row's visitors, or `0` when the value is missing or not a number.
 */
function getVisitors( row: ReportRow ): number {
	return parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0;
}

/**
 * Splits 100 whole percents between the given visitor counts.
 *
 * Rounding each share on its own can miss 100 by a percent or more, so each
 * count gets the whole part of its share, and the percents still missing go
 * to the counts with the largest remainders. When remainders tie, the earlier
 * count wins. A count at 99% gets no missing percent, so a column never shows
 * 100% beside another value.
 *
 * @since n.e.x.t
 *
 * @param {Array<number>} visitorCounts The visitor count of each row, in display order.
 * @param {number}        total         The sum of `visitorCounts`, above zero.
 * @return {Array<number>} Whole percents in the same order, adding up to 100.
 */
function getWholePercentages(
	visitorCounts: number[],
	total: number
): number[] {
	const wholePercentages = visitorCounts.map( ( visitors ) =>
		Math.floor( ( visitors * 100 ) / total )
	);
	const missingPercents =
		100 -
		wholePercentages.reduce(
			( sum, wholePercentage ) => sum + wholePercentage,
			0
		);

	visitorCounts
		// A remainder is kept as a whole number over `total`, so remainders
		// that tie compare as equal, which fractions would not always do.
		.map( ( visitors, index ) => ( {
			index,
			remainder: ( visitors * 100 ) % total,
		} ) )
		// Only a count at 99% can reach 100%, and the other counts then add
		// up to less than 1%, so they have the one missing percent to take.
		.filter( ( { index } ) => wholePercentages[ index ] < 99 )
		// `sort` is stable, so tied remainders keep the display order.
		.sort( ( first, second ) => second.remainder - first.remainder )
		.slice( 0, missingPercents )
		.forEach( ( { index } ) => {
			wholePercentages[ index ] += 1;
		} );

	return wholePercentages;
}

/**
 * Formats a row's whole percent the way a column displays it.
 *
 * @since n.e.x.t
 *
 * @param {number} wholePercentage Whole percent given to a row with visitors, `0` to `100`.
 * @return {string} The formatted share, such as `27%`, or `<1%` for `0`.
 */
function formatWholePercentage( wholePercentage: number ): string {
	// The row has visitors, so a row given no whole percent is above zero but
	// below one percent.
	if ( wholePercentage === 0 ) {
		return sprintf(
			/* translators: %s: one percent, such as "1%". The string reads "less than 1%", and is shown for a share above zero but below one percent */
			__( '<%s', 'google-site-kit' ),
			numFmt( 0.01, WHOLE_PERCENT_FORMAT )
		);
	}

	return numFmt( wholePercentage / 100, WHOLE_PERCENT_FORMAT );
}

/**
 * Shapes a breakdown report into the rows a column renders.
 *
 * The report covers the selected range only and arrives ordered by visitors,
 * so the rows are taken as they come. Values with no visitors are left out
 * first. The rest get the same cap, the same "Others" rule, and the same
 * `visitors / total` share the donut chart uses. The displayed shares add up
 * to exactly 100%, only a lone value shows 100%, and a row with visitors that
 * gets no whole percent is displayed as `<1%` rather than `0%`.
 *
 * @since 1.188.0
 * @since n.e.x.t Added `formattedPercentage` and left out values with no visitors.
 *
 * @param {Object} [report] A breakdown report.
 * @return {Array<Object>} The rows to render, empty when no value in the report has visitors.
 */
export function getBreakdownRows( report?: Report ): TrafficBreakdownRow[] {
	// Values with no visitors are left out before the cap, so none of them
	// takes a row.
	const valueRows = ( report?.rows ?? [] )
		.map( ( row ) => ( {
			label: row?.dimensionValues?.[ 0 ]?.value ?? '',
			visitors: getVisitors( row ),
		} ) )
		.filter( ( { visitors } ) => visitors > 0 );

	if ( ! valueRows.length ) {
		return [];
	}

	// One slot is kept for the trailing "Others" row.
	const shapedRows =
		valueRows.length <= TRAFFIC_BREAKDOWN_MAX_ROWS
			? valueRows
			: [
					...valueRows.slice( 0, TRAFFIC_BREAKDOWN_MAX_ROWS - 1 ),
					{
						label: __( 'Others', 'google-site-kit' ),
						visitors: valueRows
							.slice( TRAFFIC_BREAKDOWN_MAX_ROWS - 1 )
							.reduce(
								( sum, { visitors } ) => sum + visitors,
								0
							),
					},
			  ];

	const visitorCounts = shapedRows.map( ( { visitors } ) => visitors );
	const total = visitorCounts.reduce(
		( sum, visitors ) => sum + visitors,
		0
	);
	const wholePercentages = getWholePercentages( visitorCounts, total );

	return shapedRows.map( ( { label, visitors }, index ) => ( {
		label,
		percentage: visitors / total,
		formattedPercentage: formatWholePercentage( wholePercentages[ index ] ),
	} ) );
}
