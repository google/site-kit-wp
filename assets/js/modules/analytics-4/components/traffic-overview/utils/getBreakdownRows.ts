/**
 * Traffic Overview breakdown row shaping.
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
import { TRAFFIC_BREAKDOWN_MAX_ROWS } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';

export interface TrafficBreakdownRow {
	/** The dimension value, exactly as GA4 returned it. */
	label: string;
	/** The row's share of the column's total, as a `0`–`1` fraction. */
	percentage: number;
}

/**
 * Reads a row's visitor count.
 *
 * @since n.e.x.t
 *
 * @param {Object} row A breakdown report row.
 * @return {number} The row's visitors, or `0` when the value is missing or not a number.
 */
function getVisitors( row: ReportRow ): number {
	return parseInt( row?.metricValues?.[ 0 ]?.value ?? '', 10 ) || 0;
}

/**
 * Shapes a breakdown report into the rows a column renders.
 *
 * The report carries the selected range only and arrives ordered by visitors,
 * so the rows are taken as they come. This applies the same cap, the same
 * "Others" rule and the same `visitors / total` share the donut chart uses.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report] A breakdown report.
 * @return {Array<Object>} The rows to render, empty when the report has none.
 */
export function getBreakdownRows( report?: Report ): TrafficBreakdownRow[] {
	const reportRows = ( report?.rows ?? [] ) as ReportRow[];

	if ( ! reportRows.length ) {
		return [];
	}

	const total = reportRows.reduce(
		( sum, row ) => sum + getVisitors( row ),
		0
	);

	function toRow( label: string, visitors: number ) {
		return {
			label,
			percentage: total > 0 ? visitors / total : 0,
		};
	}

	if ( reportRows.length <= TRAFFIC_BREAKDOWN_MAX_ROWS ) {
		return reportRows.map( ( row ) =>
			toRow(
				row?.dimensionValues?.[ 0 ]?.value ?? '',
				getVisitors( row )
			)
		);
	}

	// One slot is kept for the trailing "Others" row.
	const named = reportRows.slice( 0, TRAFFIC_BREAKDOWN_MAX_ROWS - 1 );
	const rows = named.map( ( row ) =>
		toRow( row?.dimensionValues?.[ 0 ]?.value ?? '', getVisitors( row ) )
	);

	const othersVisitors = reportRows
		.slice( TRAFFIC_BREAKDOWN_MAX_ROWS - 1 )
		.reduce( ( sum, row ) => sum + getVisitors( row ), 0 );

	// An "Others" row that adds up to nothing says nothing.
	if ( othersVisitors > 0 ) {
		rows.push( toRow( __( 'Others', 'google-site-kit' ), othersVisitors ) );
	}

	return rows;
}
