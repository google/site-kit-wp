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
 * The rest of the total, which no row shows, takes part as the last count. So
 * the shares of the rows can add up to less than 100%, but never to more.
 *
 * @since n.e.x.t
 *
 * @param {Array<number>} counts The count of each row, in display order, each above zero.
 * @param {number}        total  The total that the shares divide, above zero.
 * @return {Array<number>} The tenths of a percent of each row, in the same order, from `0` to `1000`.
 */
function getTenthPercentages( counts: number[], total: number ): number[] {
	const countsTotal = sum( counts );
	// A column's report and the report of the site's totals are separate
	// requests. So the rows can count a little more than the total, such as a
	// view Analytics counted between the two requests. The shares then divide
	// the rows' sum, so neither a row nor a column shows more than 100%.
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
 * With `getRowLabel`, each row of the report takes the label that the
 * function returns, and rows with the same label add up to one row. Values
 * with no count are left out, and the rest are sorted by count, most first, up
 * to `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is of the site's
 * total. The shares of a column, with the share of the rest of the total, add
 * up to 100%.
 *
 * @since n.e.x.t
 *
 * @param {Object}   [report]      Optional. A report with one dimension and one metric.
 * @param {number}   [siteTotal]   Optional. The site's total of the metric, such as its visits. A row has no share when the total is `0`. Default `0`.
 * @param {Function} [getRowLabel] Optional. A function that gets the label of a row from its dimension value, or `undefined` to leave the row out. Without it, a row's label is its dimension value.
 * @return {Array<Object>} The rows. Each has a `label`, a `value` with the formatted count, such as `'12K'`, and a `secondaryValue` with the formatted share, such as `'(52.2%)'`.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	siteTotal = 0,
	getRowLabel?: ( dimensionValue: string ) => string | undefined
): TableTileRow[] {
	// A `Map` keeps the order of the report, so a sort keeps that order for
	// labels with the same count.
	const counts = new Map< string, number >();

	( report?.rows ?? [] ).forEach( ( row ) => {
		const dimensionValue = row.dimensionValues?.[ 0 ]?.value ?? '';
		const label = getRowLabel
			? getRowLabel( dimensionValue )
			: dimensionValue;

		if ( label === undefined ) {
			return;
		}

		counts.set(
			label,
			( counts.get( label ) ?? 0 ) + getMetricCount( row )
		);
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
