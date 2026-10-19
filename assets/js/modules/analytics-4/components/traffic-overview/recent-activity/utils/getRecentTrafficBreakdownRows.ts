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

/**
 * Builds the rows a column of the Recent activity tab's traffic breakdown
 * renders from its report.
 *
 * With `getRowKey`, the rows of the report that the function returns the same
 * key for add up to one row, whose label is that key. Values with no count are
 * left out, and the rest are sorted by count, most first, up to
 * `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is a percentage of the
 * report's total, which also counts the values that no row shows, such as those
 * past the report's `limit`.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [report]    Optional. A report with one dimension and one metric.
 * @param {Function} [getRowKey] Optional. A function that returns the key of a row from its dimension value, or `undefined` to leave the row out. Without it, a row's key is its dimension value.
 * @return {Array<Object>} The rows. Each has a `label`, a `value` with the formatted count, such as `'12K'`, and a `secondaryValue` with the formatted share, such as `'(52.2%)'`. The `secondaryValue` is `undefined` when the report has no total.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	getRowKey?: ( dimensionValue: string ) => string | undefined
): TableTileRow[] {
	const total = getMetricCount( report?.totals?.[ 0 ] );

	// A `Map` keeps the order of the report, so a sort keeps that order for
	// keys with the same count.
	const counts = new Map< string, number >();

	( report?.rows ?? [] ).forEach( ( row ) => {
		const dimensionValue = row.dimensionValues?.[ 0 ]?.value ?? '';
		const key = getRowKey ? getRowKey( dimensionValue ) : dimensionValue;

		if ( key === undefined ) {
			return;
		}

		counts.set( key, ( counts.get( key ) ?? 0 ) + getMetricCount( row ) );
	} );

	const rows = Array.from( counts, ( [ label, count ] ) => ( {
		label,
		count,
	} ) )
		// A report includes values with no count, which a column leaves out.
		.filter( ( { count } ) => count > 0 )
		.sort( ( first, second ) => second.count - first.count )
		.slice( 0, RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS );

	const tenths =
		total > 0
			? getTenthPercentages(
					rows.map( ( { count } ) => count ),
					total
			  )
			: [];

	return rows.map( ( { label, count }, index ) => ( {
		label,
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
