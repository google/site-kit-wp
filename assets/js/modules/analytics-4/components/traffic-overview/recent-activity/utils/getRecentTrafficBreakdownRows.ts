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
 * A share that the format rounds to `0%` is shown as `<0.1%`, and a share below
 * one that it rounds to `100%` is shown as `>99.9%`. So a row with visitors
 * never reads `0%`, and a row reads `100%` only when no other value had
 * visitors.
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
			/* translators: %s: a tenth of one percent, such as "0.1%". The string reads "less than 0.1%", and is shown for a share above zero but below a tenth of one percent */
			__( '<%s', 'google-site-kit' ),
			numFmt( 0.001, SHARE_FORMAT )
		);
	}

	if ( share < 1 && formattedShare === numFmt( 1, SHARE_FORMAT ) ) {
		return sprintf(
			/* translators: %s: a share just below one hundred percent, such as "99.9%". The string reads "more than 99.9%", and is shown for a share above 99.9% but below 100% */
			__( '>%s', 'google-site-kit' ),
			numFmt( 0.999, SHARE_FORMAT )
		);
	}

	return formattedShare;
}

/**
 * Shapes a report into the rows a column of the Recent activity tab's traffic
 * breakdown renders.
 *
 * Values with no visitors are left out. The rest are sorted by visitors, most
 * first, and the first `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` of them become rows.
 * Each row shows its visitors, and its share of the visitors of every value in
 * the report, not only of the rows shown. So the shares of all the values in
 * the report add up to 100%, and the shares shown add up to 100% only when the
 * report has no more values than the column shows.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] A report with one dimension and the `totalUsers` metric.
 * @return {Array<Object>} The rows to render, each with the dimension value as its `label`, the visitors as its `value` and the share as its `secondaryValue`. Empty when no value in the report had visitors.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report
): TableTileRow[] {
	// A report keeps the values with no visitors unless it is asked not to,
	// and a column lists only the values that had visitors.
	const valueRows = ( report?.rows ?? [] )
		.map( ( row ) => ( {
			label: row.dimensionValues?.[ 0 ]?.value ?? '',
			visitors: parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
		} ) )
		.filter( ( { visitors } ) => visitors > 0 );

	const totalVisitors = valueRows.reduce(
		( sum, { visitors } ) => sum + visitors,
		0
	);

	return (
		valueRows
			// `sort` is stable, so values with the same visitors keep the
			// order of the report.
			.sort( ( first, second ) => second.visitors - first.visitors )
			.slice( 0, RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS )
			.map( ( { label, visitors } ) => ( {
				label,
				value: numFmt( visitors ),
				secondaryValue: sprintf(
					/* translators: %s: the row's share of the visitors in its column, such as "34.1%". */
					__( '(%s)', 'google-site-kit' ),
					formatShare( visitors / totalVisitors )
				),
			} ) )
	);
}
