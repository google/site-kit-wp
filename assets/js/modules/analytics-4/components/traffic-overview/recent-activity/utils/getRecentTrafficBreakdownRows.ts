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
 * Formats a row's share of the site's visitors.
 *
 * A share that rounds to `0%` shows as `<0.1%`, and a share below `1` that
 * rounds to `100%` shows as `>99.9%`. So a row shows `100%` only when its
 * visitors reach the site's total.
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
			/* translators: %s: a tenth of one percent, such as "0.1%", in a string that reads as "less than 0.1%" */
			__( '<%s', 'google-site-kit' ),
			numFmt( 0.001, SHARE_FORMAT )
		);
	}

	if ( share < 1 && formattedShare === numFmt( 1, SHARE_FORMAT ) ) {
		return sprintf(
			/* translators: %s: a share just below one hundred percent, such as "99.9%", in a string that reads as "more than 99.9%" */
			__( '>%s', 'google-site-kit' ),
			numFmt( 0.999, SHARE_FORMAT )
		);
	}

	return formattedShare;
}

/**
 * Gets the visitors in a report's total, which counts each visitor once.
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
 * renders from its report.
 *
 * Values with no visitors are omitted, and the rest are sorted by visitors,
 * most first, up to `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is of
 * the site's visitors, so a column's shares can add up to more than 100% when
 * a visitor is counted in two rows.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report]             Optional. A report with one dimension and the `totalUsers` metric.
 * @param {Object} [siteVisitorsReport] Optional. The report of the site's visitors, with its `totals`.
 * @return {Array<Object>} The rows, each with the dimension value as its `label`, the visitors as its `value`, such as `'12K'` rather than `12345`, and the share as its `secondaryValue`, such as `'(52.2%)'` rather than `0.522`. A row has no share when the report of the site's visitors has no total, or a total of zero.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	siteVisitorsReport?: Report
): TableTileRow[] {
	const siteVisitors = getTotalVisitors( siteVisitorsReport );

	return (
		( report?.rows ?? [] )
			.map( ( row ) => ( {
				label: row.dimensionValues?.[ 0 ]?.value ?? '',
				visitors:
					parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
			} ) )
			// A report includes values with no visitors, which a column omits.
			.filter( ( { visitors } ) => visitors > 0 )
			.sort( ( first, second ) => second.visitors - first.visitors )
			.slice( 0, RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS )
			.map( ( { label, visitors } ) => ( {
				label,
				value: numFmt( visitors ),
				secondaryValue:
					siteVisitors > 0
						? sprintf(
								/* translators: %s: the row's share of the site's visitors, such as "52.2%" */
								__( '(%s)', 'google-site-kit' ),
								// Analytics visitor counts are estimates, so a
								// row's count can be a little higher than the
								// total.
								formatShare(
									Math.min( visitors / siteVisitors, 1 )
								)
						  )
						: undefined,
			} ) )
	);
}
