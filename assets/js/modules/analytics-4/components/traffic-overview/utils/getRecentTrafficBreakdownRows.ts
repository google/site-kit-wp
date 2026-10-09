/**
 * Recent activity breakdown row shaping.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';

const ONE_DECIMAL_PERCENT_FORMAT = {
	style: 'percent',
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
} as const;

/**
 * Formats a row's share of its column's visitors, in parentheses.
 *
 * The share has one decimal place. A row with visitors never shows `0.0%`, and
 * only a row that has every visitor of its column shows `100.0%`.
 *
 * @since n.e.x.t
 *
 * @param {number} visitors The row's visitors, above zero.
 * @param {number} total    The visitors of every row in the column.
 * @return {string} The formatted share, such as `(34.1%)` or `(<0.1%)`.
 */
function formatShare( visitors: number, total: number ): string {
	const shareInTenthsOfPercent = Math.round( ( visitors * 1000 ) / total );

	let formattedShare: string;

	if ( shareInTenthsOfPercent === 0 ) {
		formattedShare = sprintf(
			/* translators: %s: a tenth of a percent, such as "0.1%". The string reads "less than 0.1%", and is shown for a share above zero but below a tenth of a percent */
			__( '<%s', 'google-site-kit' ),
			numFmt( 0.001, ONE_DECIMAL_PERCENT_FORMAT )
		);
	} else {
		// A share that rounds up to 100.0% shows 99.9% while another row has
		// visitors too.
		const shownTenthsOfPercent =
			visitors < total
				? Math.min( shareInTenthsOfPercent, 999 )
				: shareInTenthsOfPercent;

		formattedShare = numFmt(
			shownTenthsOfPercent / 1000,
			ONE_DECIMAL_PERCENT_FORMAT
		);
	}

	return sprintf(
		/* translators: %s: a row's share of the visitors in its column, such as "34.1%" or "<0.1%" */
		__( '(%s)', 'google-site-kit' ),
		formattedShare
	);
}

/**
 * Shapes a Recent activity breakdown report into the rows a column renders.
 *
 * Leaves out the values with no visitors, sorts the rest by visitors, most
 * first, and returns a row for each of the top three. Each row has its visitors
 * and its share of the visitors of every value in the report, so the shares of
 * the three rows add up to less than 100% when the report has more values.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] A breakdown report, with one dimension and the `totalUsers` metric.
 * @return {Array<Object>} At most three rows, each with the dimension value as its `label`. The array is empty when no value has visitors.
 */
export function getRecentTrafficBreakdownRows(
	report?: Report
): TableTileRow[] {
	const valueRows = ( report?.rows ?? [] )
		.map( ( row ) => ( {
			label: row.dimensionValues?.[ 0 ]?.value ?? '',
			visitors: parseInt( row.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0,
		} ) )
		.filter( ( { visitors } ) => visitors > 0 );

	const total = valueRows.reduce(
		( sum, { visitors } ) => sum + visitors,
		0
	);

	return valueRows
		.sort(
			( firstRow, secondRow ) => secondRow.visitors - firstRow.visitors
		)
		.slice( 0, 3 )
		.map( ( { label, visitors } ) => ( {
			label,
			value: numFmt( visitors ),
			secondaryValue: formatShare( visitors, total ),
		} ) );
}
