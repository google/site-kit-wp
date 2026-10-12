/**
 * Recent traffic breakdown row shaping.
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
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

const SHARE_FORMAT = {
	style: 'percent',
	maximumFractionDigits: 1,
} as const;

/**
 * Formats a row's share of the visitors in its column.
 *
 * A share that rounds to `0%` shows as `<0.1%`, and a share below `1` that
 * rounds to `100%` shows as `>99.9%`. So a row shows `100%` only when its
 * visitors reach the column's total.
 *
 * @since n.e.x.t
 *
 * @param {number} share The row's share, above `0` and up to `1`.
 * @return {string} The formatted share, such as `34.1%`.
 */
function formatShare( share: number ): string {
	const formattedShare = numFmt( share, SHARE_FORMAT );

	if ( formattedShare === numFmt( 0, SHARE_FORMAT ) ) {
		return sprintf(
			/* translators: %s: a tenth of one percent, such as "0.1%". Reads as "less than 0.1%" */
			__( '<%s', 'google-site-kit' ),
			numFmt( 0.001, SHARE_FORMAT )
		);
	}

	if ( share < 1 && formattedShare === numFmt( 1, SHARE_FORMAT ) ) {
		return sprintf(
			/* translators: %s: a share just below one hundred percent, such as "99.9%". Reads as "more than 99.9%" */
			__( '>%s', 'google-site-kit' ),
			numFmt( 0.999, SHARE_FORMAT )
		);
	}

	return formattedShare;
}

/**
 * Reads a report's visitor total, which counts a visitor once even when the
 * visitor appears in several rows.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. A report with the `totalUsers` metric.
 * @return {number} The visitors in the report's total, or `0` when the report has no total.
 */
function getTotalVisitors( report?: Report ): number {
	return (
		parseInt(
			report?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0
	);
}

/**
 * Builds the rows a column of the Recent activity tab's traffic breakdown
 * renders from a report.
 *
 * Values with no visitors are left out, and the rest are sorted by visitors,
 * most first, up to `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is of
 * the report's visitor total, which counts a visitor once, so the shares can
 * add up to more than 100%.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. A report with one dimension, the `totalUsers` metric, and its `totals`.
 * @return {Array<Object>} The rows, each with the dimension value as its `label`, the visitors as its `value`, and the share as its `secondaryValue`. A row has no share when the report has no total.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report
): TableTileRow[] {
	const totalVisitors = getTotalVisitors( report );

	return (
		( report?.rows ?? [] )
			.map( ( row ) => ( {
				label: row.dimensionValues?.[ 0 ]?.value ?? '',
				visitors:
					parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
			} ) )
			// A report includes values with no visitors, which a column leaves
			// out.
			.filter( ( { visitors } ) => visitors > 0 )
			.sort( ( first, second ) => second.visitors - first.visitors )
			.slice( 0, RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS )
			.map( ( { label, visitors } ) => ( {
				label,
				value: numFmt( visitors ),
				secondaryValue:
					totalVisitors > 0
						? sprintf(
								/* translators: %s: the row's share of the visitors in its column, such as "34.1%" */
								__( '(%s)', 'google-site-kit' ),
								// Analytics visitor counts are estimates, so a
								// row can come out a little above the total.
								formatShare(
									Math.min( visitors / totalVisitors, 1 )
								)
						  )
						: undefined,
			} ) )
	);
}
