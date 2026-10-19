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
import { SITE_TOTALS_METRICS } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	formatRoundedShare,
	getMetricCount,
	getRoundedShares,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
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
 * @param {number}        total  The total that each share is a percentage of, above zero.
 * @return {Array<number>} The tenths of a percent of each row, in the same order, from `0` to `1000`.
 */
function getTenthPercentages( counts: number[], total: number ): number[] {
	const countsTotal = sum( counts );
	// The rows and the site's total come from separate requests, so the rows
	// can count a little more than the total, such as a view Analytics counted
	// between the two. The shares then use the rows' sum, so no row or column
	// shows more than 100%.
	const sharedTotal = Math.max( total, countsTotal );

	return getRoundedShares(
		[ ...counts, sharedTotal - countsTotal ],
		1000
	).slice( 0, counts.length );
}

/**
 * Gets the site's total of the metric that a column's report counts, from the
 * report of the site's totals.
 *
 * @since n.e.x.t
 *
 * @param {Object} [siteTotalsReport] Optional. The report of the site's totals, with its `totals`.
 * @param {Object} [reportOptions]    Optional. The options of the column's report, which name the metric it counts.
 * @return {number} The total, such as the site's visits for the channels column, or `0` when the report of the site's totals has no total.
 */
export function getSiteTotal(
	siteTotalsReport?: Report,
	reportOptions?: ReportOptions
): number {
	const [ metric ] = reportOptions?.metrics ?? [];
	const metricIndex = SITE_TOTALS_METRICS.indexOf(
		typeof metric === 'string' ? metric : metric?.name ?? ''
	);

	return getMetricCount( siteTotalsReport?.totals?.[ 0 ], metricIndex );
}

/**
 * Builds the rows a column of the Recent activity tab's traffic breakdown
 * renders from its report.
 *
 * Values with no count are left out, and the rest are sorted by count, most
 * first, up to `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is a
 * percentage of the site's total. With the share of the rest of the total, the
 * shares of a column add up to 100%.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report]    Optional. A report with one dimension and one metric.
 * @param {number} [siteTotal] Optional. The site's total of the metric, such as its visits. A row has no share when the total is `0`. Default `0`.
 * @return {Array<Object>} The rows. Each has a `label`, a `value` with the formatted count, such as `'12K'`, and a `secondaryValue` with the formatted share, such as `'(52.2%)'`.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	siteTotal = 0
): TableTileRow[] {
	const rows = ( report?.rows ?? [] )
		.map( ( row ) => ( {
			label: row.dimensionValues?.[ 0 ]?.value ?? '',
			count: getMetricCount( row ),
		} ) )
		// A report includes values with no count, which a column leaves out.
		.filter( ( { count } ) => count > 0 )
		.sort( ( first, second ) => second.count - first.count )
		.slice( 0, RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS );

	const tenths =
		siteTotal > 0
			? getTenthPercentages(
					rows.map( ( { count } ) => count ),
					siteTotal
			  )
			: [];

	return rows.map( ( { label, count }, index ) => ( {
		label,
		value: numFmt( count ),
		secondaryValue:
			siteTotal > 0
				? sprintf(
						/* translators: %s: the row's share of the site's total, such as "52.2%" */
						__( '(%s)', 'google-site-kit' ),
						formatRoundedShare( tenths[ index ], 1000 )
				  )
				: undefined,
	} ) );
}
