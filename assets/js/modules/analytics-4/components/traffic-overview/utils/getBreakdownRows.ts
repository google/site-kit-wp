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
 * External dependencies
 */
import { sum, sumBy } from 'lodash';

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

/**
 * Reads the count of a metric in a report row, such as its visitors.
 *
 * @since 1.188.0
 * @since n.e.x.t Renamed from `getVisitors()`, exported, and takes an optional row and the index of the metric to read.
 *
 * @param {Object} [row]         Optional. A report row.
 * @param {number} [metricIndex] Optional. The index of the metric in the row's metric values. Default `0`.
 * @return {number} The count, or `0` when the row has no value for the metric or the value isn't a number.
 */
export function getMetricCount( row?: ReportRow, metricIndex = 0 ): number {
	return parseInt( row?.metricValues?.[ metricIndex ]?.value ?? '', 10 ) || 0;
}

/**
 * Splits a whole between the given parts in whole steps, such as whole
 * percents or tenths of a percent.
 *
 * Rounding each share on its own can miss the whole by a step or more. So
 * each part gets the whole steps of its share, and the steps still missing go
 * to the parts with the largest remainders. Of two equal remainders, the
 * earlier part gets the step. A part one step short of the whole gets no
 * missing step, so a share never shows the whole beside another share.
 *
 * @since 1.189.0
 * @since n.e.x.t Renamed from `getWholePercentages()`, and takes the number of steps in the whole, so it splits tenths of a percent too.
 *
 * @param {Array<number>} parts The parts, in display order, adding up to more than zero.
 * @param {number}        steps The steps in the whole, such as `100` for whole percents or `1000` for tenths of a percent.
 * @return {Array<number>} The steps of each part, in the same order, adding up to `steps`.
 */
export function getRoundedShares( parts: number[], steps: number ): number[] {
	const total = sum( parts );
	const shares = parts.map( ( part ) =>
		Math.floor( ( part * steps ) / total )
	);
	const missingSteps = steps - sum( shares );

	parts
		// Remainders are whole numbers over `total`, because fractions that
		// should be equal can have different last digits.
		.map( ( part, index ) => ( {
			index,
			remainder: ( part * steps ) % total,
		} ) )
		// Only a part one step short of the whole can reach it. The other
		// parts then add up to less than one step, so one of them gets the
		// missing step.
		.filter( ( { index } ) => shares[ index ] < steps - 1 )
		// `sort` is stable, so equal remainders keep the order of the parts.
		.sort( ( first, second ) => second.remainder - first.remainder )
		.slice( 0, missingSteps )
		.forEach( ( { index } ) => {
			shares[ index ] += 1;
		} );

	return shares;
}

/**
 * Formats the share of a part with a count above zero, such as `27%` or
 * `52.2%`.
 *
 * @since 1.189.0
 * @since n.e.x.t Renamed from `formatWholePercentage()`, and takes the number of steps in the whole, so it formats tenths of a percent too.
 *
 * @param {number} share The share in steps, from `0`, and above `steps` where the part counts more than the whole.
 * @param {number} steps The steps in the whole, `100` for whole percents or `1000` for tenths of a percent.
 * @return {string} The formatted share, or one step with `<` before it for `0`, such as `<1%`.
 */
export function formatRoundedShare( share: number, steps: number ): string {
	const format = {
		style: 'percent',
		// `100` steps show no decimal place, and `1000` steps always show one,
		// such as `3.0%`.
		minimumFractionDigits: Math.log10( steps ) - 2,
		maximumFractionDigits: Math.log10( steps ) - 2,
	} as const;

	// The part has a count above zero, so a share of no step is above zero but
	// below one step.
	if ( share === 0 ) {
		return sprintf(
			/* translators: %s: the smallest share a breakdown shows, such as "1%" or "0.1%". The string reads "less than 1%" */
			__( '<%s', 'google-site-kit' ),
			numFmt( 1 / steps, format )
		);
	}

	return numFmt( share / steps, format );
}

/**
 * Shapes a breakdown report into the rows a column renders.
 *
 * The report covers the selected range only and arrives ordered by visitors,
 * so the rows are taken as they come. Values with no visitors are left out
 * first. When more than `TRAFFIC_BREAKDOWN_MAX_ROWS` values have visitors, the
 * top values fill every row except the last, and an "Others" row adds up the
 * rest. The displayed shares add up to exactly 100%, only a lone value shows
 * 100%, and a row with visitors that gets no whole percent is displayed as
 * `<1%` rather than `0%`.
 *
 * @since 1.188.0
 * @since 1.189.0 Added `formattedPercentage` and left out values with no visitors.
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
			visitors: getMetricCount( row ),
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
						visitors: sumBy(
							valueRows.slice( TRAFFIC_BREAKDOWN_MAX_ROWS - 1 ),
							'visitors'
						),
					},
			  ];

	const visitorCounts = shapedRows.map( ( { visitors } ) => visitors );
	const total = sum( visitorCounts );
	const wholePercentages = getRoundedShares( visitorCounts, 100 );

	return shapedRows.map( ( { label, visitors }, index ) => ( {
		label,
		percentage: visitors / total,
		formattedPercentage: formatRoundedShare(
			wholePercentages[ index ],
			100
		),
	} ) );
}
