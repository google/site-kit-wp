/**
 * Recent traffic breakdown rows helper.
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
import { sum } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import {
	formatRoundedShare,
	getMetricCount,
	getRoundedShares,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

/**
 * Splits a thousand tenths of a percent between the given counts and the
 * rest of the total, with `getRoundedShares()`.
 *
 * The rest of the total, which no row shows, is the last part. So the shares of
 * the rows can add up to less than 100%, but never to more.
 *
 * @since n.e.x.t
 *
 * @param {Array<number>} counts The count of each row, in display order, each above zero.
 * @param {number}        total  The total that each share is a percentage of, at least the sum of `counts`.
 * @return {Array<number>} The tenths of a percent of each row, in the same order, from `0` to `1000`.
 */
function getTenthPercentages( counts: number[], total: number ): number[] {
	const parts = [ ...counts, total - sum( counts ) ];

	return getRoundedShares( parts, 1000 ).slice( 0, counts.length );
}

interface RowCount {
	/** The key the rows add up under, such as the dimension value or the ID of a post. */
	key: string;
	/** The sum of the counts of the rows with the key. */
	count: number;
}

/**
 * Adds up the count of the rows of a report under the key of each row, and
 * sorts the keys by count, most first.
 *
 * A row whose key is `null` is left out, and so is a key with no count. Keys
 * with the same count keep the order of the report.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [report]    Optional. A report with one dimension and one metric.
 * @param {Function} [getRowKey] Optional. Gets the key of a row from its dimension value, or `null` to leave the row out. Default: the dimension value.
 * @return {Array<Object>} The `key` and the `count` of each key, most counted first.
 */
export function getRowCounts(
	report?: Report,
	getRowKey: ( dimensionValue: string ) => string | null = (
		dimensionValue
	) => dimensionValue
): RowCount[] {
	const counts = new Map< string, number >();

	for ( const row of report?.rows ?? [] ) {
		const key = getRowKey( row.dimensionValues?.[ 0 ]?.value ?? '' );

		if ( key !== null ) {
			counts.set(
				key,
				( counts.get( key ) ?? 0 ) + getMetricCount( row )
			);
		}
	}

	return (
		Array.from( counts, ( [ key, count ] ) => ( { key, count } ) )
			// A report includes values with no count, which a column leaves out.
			.filter( ( { count } ) => count > 0 )
			.sort( ( first, second ) => second.count - first.count )
	);
}

/**
 * Builds the rows a column of the Recent activity tab's traffic breakdown
 * renders from its report.
 *
 * The rows of the report add up under their keys, by `getRowCounts()`, up to
 * `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` keys. Each share is a percentage of the
 * report's total, which also counts the values that the report's `limit` or
 * `getRowKey` leaves out.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [report]    Optional. A report with one dimension and one metric.
 * @param {Function} [getRowKey] Optional. Gets the key of a row from its dimension value, or `null` to leave the row out, as `getRowCounts()` reads it.
 * @return {Array<Object>} The rows. Each has a `label` with its key, a `value` with the formatted count, such as `'12K'`, and a `secondaryValue` with the formatted share, such as `'(52.2%)'`. The `secondaryValue` is `undefined` when the report has no total.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	getRowKey?: ( dimensionValue: string ) => string | null
): TableTileRow[] {
	const total = getMetricCount( report?.totals?.[ 0 ] );

	const rows = getRowCounts( report, getRowKey ).slice(
		0,
		RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS
	);

	const tenths =
		total > 0
			? getTenthPercentages(
					rows.map( ( { count } ) => count ),
					total
			  )
			: [];

	return rows.map( ( { key, count }, index ) => ( {
		label: key,
		value: numFmt( count ),
		secondaryValue:
			total > 0
				? sprintf(
						/* translators: %s: the row's share of the column's total, such as "52.2%" */
						__( '(%s)', 'google-site-kit' ),
						formatRoundedShare( tenths[ index ], 1000 )
				  )
				: undefined,
	} ) );
}
