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
import {
	formatRoundedShare,
	getMetricCount,
} from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

/**
 * Gets a count's share of a total in tenths of a percent, rounded to the
 * nearest tenth.
 *
 * A count below the total gets at most 999 tenths, so its share never reads
 * 100.0%.
 *
 * @since n.e.x.t
 *
 * @param {number} count The count of a row, above zero.
 * @param {number} total The total that the share is a percentage of, above zero.
 * @return {number} The share in tenths of a percent, such as `522` for 52.2%.
 */
function getTenthPercentage( count: number, total: number ): number {
	const tenths = Math.round( ( count / total ) * 1000 );

	return count < total ? Math.min( tenths, 999 ) : tenths;
}

/**
 * Builds the rows a column of the Recent activity tab's traffic breakdown
 * renders from its report.
 *
 * Values with no count are left out, and the rest are sorted by count, most
 * first, up to `RECENT_TRAFFIC_BREAKDOWN_MAX_ROWS` rows. Each share is a
 * percentage of the given total. A visitor can count in more than one row, so
 * the shares of a column can add up to more than 100%.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] Optional. A report with one dimension and one metric.
 * @param {number} [total]  Optional. The total that each share is a percentage of, such as the site's visitors. Default `0`, which shows no share.
 * @return {Array<Object>} The rows. Each has a `label`, a `value` with the formatted count, such as `'12K'`, and a `secondaryValue` with the formatted share, such as `'(52.2%)'`. The `secondaryValue` is `undefined` when the total is `0`.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report,
	total = 0
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

	return rows.map( ( { label, count } ) => ( {
		label,
		value: numFmt( count ),
		secondaryValue:
			total > 0
				? sprintf(
						/* translators: %s: the row's share of the visitors the columns count, such as "52.2%" */
						__( '(%s)', 'google-site-kit' ),
						formatRoundedShare(
							getTenthPercentage( count, total ),
							1000
						)
				  )
				: undefined,
	} ) );
}
