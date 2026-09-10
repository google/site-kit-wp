/**
 * Shared report-row mapping helpers for Site Goals goal drivers.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GoalDriverRow } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { GoalDriverRowMapper } from './types';

/**
 * Reads a report row's metric value as a number.
 *
 * @since n.e.x.t
 *
 * @param {Object} row   The report row.
 * @param {number} index The metric's index in `row.metricValues`. Defaults to the first metric.
 * @return {number} The parsed metric value, or `0` if missing.
 */
export function parseMetricValue( row: ReportRow, index = 0 ): number {
	return parseFloat( String( row.metricValues?.[ index ]?.value ?? 0 ) );
}

/**
 * Maps rows to each row's share of a total as a percentage.
 *
 * Most drivers don't fetch a total separately - the rows they're given are the
 * whole answer, so their total is summed from those same rows, and every
 * surface rendering the driver must therefore request the same row limit, or
 * a smaller limit on one surface would understate the total there and skew its
 * percentages relative to the other. `topAuthors` and `topTrafficChannels` are
 * the exception: rather than a share of the ranked, limited rows shown, their
 * percentage is a share of every event site-wide, so the caller fetches that
 * true total separately and passes it in as `explicitTotal`.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} rows            Report rows, each expected to carry an `eventCount` in `metricValues[0]`.
 * @param {Function} getLabel        Maps a row to its display label.
 * @param {number}   [explicitTotal] The total to divide by, when it isn't the sum of `rows`.
 * @return {Object[]} The rows mapped to `{ label, value }`, `value` formatted as a percentage of the total.
 */
export function mapRowsToShareOfTotal(
	rows: ReportRow[],
	getLabel: ( row: ReportRow ) => string,
	explicitTotal?: number
): GoalDriverRow[] {
	const total =
		explicitTotal ??
		rows.reduce( ( sum, row ) => sum + parseMetricValue( row ), 0 );

	return rows.map( ( row ) => ( {
		label: getLabel( row ),
		value: numFmt( total > 0 ? parseMetricValue( row ) / total : 0, {
			style: 'percent',
			signDisplay: 'never',
			maximumFractionDigits: 1,
		} ),
	} ) );
}

/**
 * Builds a share-of-total row mapper for a single-dimension driver.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [options]            Options.
 * @param {Function} [options.getLabel]   Maps the row's raw (non-empty) dimension value to its display label. Defaults to the raw value.
 * @param {string}   [options.emptyLabel] Label used when the dimension value is empty. Defaults to "(not set)".
 * @return {Function} The row mapper.
 */
export function makeShareOfTotalMapper( {
	getLabel = ( value: string ) => value,
	emptyLabel = __( '(not set)', 'google-site-kit' ),
}: {
	getLabel?: ( dimensionValue: string ) => string;
	emptyLabel?: string;
} = {} ): GoalDriverRowMapper {
	return ( rows ) =>
		mapRowsToShareOfTotal( rows, ( row ) => {
			const dimensionValue = row.dimensionValues?.[ 0 ]?.value || '';

			return dimensionValue ? getLabel( dimensionValue ) : emptyLabel;
		} );
}

/**
 * Builds a row mapper that divides by an explicitly given total rather than
 * the sum of the rows it's mapping.
 *
 * `topAuthors` and `topTrafficChannels` use this: their percentage is each
 * row's share of every event site-wide, not just the ranked rows shown, so the
 * caller fetches that total separately (see `buildGoalDriverTotalReportOptions`
 * in `reportOptionsHelpers.ts`) and passes the resolved count in here.
 *
 * @since n.e.x.t
 *
 * @param {number}   totalCount           The total to divide each row's `eventCount` by.
 * @param {Object}   [options]            Options.
 * @param {Function} [options.getLabel]   Maps the row's raw (non-empty) dimension value to its display label. Defaults to the raw value.
 * @param {string}   [options.emptyLabel] Label used when the dimension value is empty. Defaults to "(not set)".
 * @return {Function} The row mapper.
 */
export function makeShareOfExplicitTotalMapper(
	totalCount: number,
	{
		getLabel = ( value: string ) => value,
		emptyLabel = __( '(not set)', 'google-site-kit' ),
	}: {
		getLabel?: ( dimensionValue: string ) => string;
		emptyLabel?: string;
	} = {}
): GoalDriverRowMapper {
	return ( rows ) =>
		mapRowsToShareOfTotal(
			rows,
			( row ) => {
				const dimensionValue = row.dimensionValues?.[ 0 ]?.value || '';

				return dimensionValue ? getLabel( dimensionValue ) : emptyLabel;
			},
			totalCount
		);
}

/**
 * Reads a site-wide total report's single row into a plain count.
 *
 * @since n.e.x.t
 *
 * @param {Object}      [totalReport]      The report `buildGoalDriverTotalReportOptions` requested.
 * @param {ReportRow[]} [totalReport.rows] The report's rows.
 * @return {number} The total event count, or `0` if the report has no data yet.
 */
export function getGoalDriverTotalCount( totalReport?: {
	rows?: ReportRow[];
} ): number {
	const [ totalRow ] = totalReport?.rows || [];

	return totalRow ? parseMetricValue( totalRow ) : 0;
}
