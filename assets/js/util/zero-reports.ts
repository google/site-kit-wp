/**
 * Utility functions for zeroing Analytics report data.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import invariant from 'invariant';

export interface Analytics4ReportCell {
	dimensionValues?: Array< { value?: string } >;
	metricValues?: Array< { value?: string } >;
	[ key: string ]: unknown;
}

export interface Analytics4Report {
	rows?: Analytics4ReportCell[];
	rowCount?: number;
	totals?: Analytics4ReportCell[];
	maximums?: Analytics4ReportCell[];
	minimums?: Analytics4ReportCell[];
	[ key: string ]: unknown;
}

interface AdSenseReportCell {
	value: number | string;
	[ key: string ]: unknown;
}

interface AdSenseReportRow {
	cells: AdSenseReportCell[];
	[ key: string ]: unknown;
}

interface AdSenseReport {
	totals: { cells: AdSenseReportCell[] };
	rows: AdSenseReportRow[];
	[ key: string ]: unknown;
}

interface SearchConsoleReportRow {
	clicks?: number;
	ctr?: number;
	impressions?: number;
	position?: number;
	[ key: string ]: unknown;
}

interface SearchConsoleReportOptions {
	dimensions?: string;
	[ key: string ]: unknown;
}

/**
 * Returns a copy of the provided Analytics 4 report with all values removed,
 * matching the format of an empty report.
 *
 * @since 1.95.0
 *
 * @param {Object} report Analytics 4 report object.
 * @return {Object} Empty Analytics 4 report object.
 */
export function replaceValuesInAnalytics4ReportWithZeroData(
	report: Analytics4Report
): Analytics4Report {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Ignore `rows` and `rowCount` since we're omitting them from the returned report object.
	const { rows, rowCount, ...reportWithoutRows } = report;

	function toEmptyObject(): Record< string, never > {
		return {};
	}

	return {
		...reportWithoutRows,
		totals: report.totals?.map( toEmptyObject ),
		maximums: report.maximums?.map( toEmptyObject ),
		minimums: report.minimums?.map( toEmptyObject ),
	};
}

/**
 * Returns a copy of the provided Analytics 4 report with values simulating
 * a specified date range with no data either zeroing or removing empty rows.
 *
 * @since 1.153.0
 *
 * @param {Object} report           Analytics 4 report object.
 * @param {string} dateRangeKey     Date range key to match.
 * @param {string} emptyRowBehavior How to handle empty rows: 'zero' to keep rows with zero values, 'remove' to remove rows.
 * @return {Object} Analytics 4 report object with values replaced or rows removed.
 */
export function replaceValuesOrRemoveRowForDateRangeInAnalyticsReport(
	report: Analytics4Report,
	dateRangeKey: string = 'date_range_1',
	emptyRowBehavior: 'zero' | 'remove' = 'zero'
): Analytics4Report {
	invariant(
		[ 'zero', 'remove' ].includes( emptyRowBehavior ),
		'emptyRowBehavior must be either "zero" or "remove"'
	);

	const { rows, totals, minimums, maximums } = report;

	function matchesDateRange( cell: Analytics4ReportCell ): boolean {
		return !! cell.dimensionValues?.some(
			( value ) => value.value === dateRangeKey
		);
	}

	function mapDateRangeToZero( cells: Analytics4ReportCell[] = [] ) {
		return cells.map( ( cell ) => {
			if ( matchesDateRange( cell ) ) {
				return {
					...cell,
					metricValues: cell.metricValues?.map( () => {
						return { value: '0' };
					} ),
				};
			}
			return cell;
		} );
	}

	// If emptyRowBehavior is 'zero', keep the rows but zero the value for each row and aggregate key in the specified date range.
	if ( emptyRowBehavior === 'zero' ) {
		return {
			...report,
			rows: mapDateRangeToZero( rows ),
			totals: mapDateRangeToZero( totals ),
			minimums: mapDateRangeToZero( minimums ),
			maximums: mapDateRangeToZero( maximums ),
		};
	}

	// If emptyRowBehavior is 'remove', remove the rows and aggregate data that has a dimensionValues[].value equal to dateRangeKey.
	function removeDateRangeEntirely(
		cells: Analytics4ReportCell[] = []
	): Analytics4ReportCell[] {
		return cells.filter( ( cell ) => {
			return ! matchesDateRange( cell );
		} );
	}

	const filteredRows = removeDateRangeEntirely( rows );

	return {
		...report,
		rows: filteredRows,
		rowCount: filteredRows.length,
		totals: removeDateRangeEntirely( totals ),
		minimums: removeDateRangeEntirely( minimums ),
		maximums: removeDateRangeEntirely( maximums ),
	};
}

/**
 * Returns an AdSense report with zeroed data.
 *
 * @since 1.78.0
 * @since 1.145.0 Moved from `stories/utils/adsense-data-zeroing.js`.
 *
 * @param {Object} report AdSense report data.
 * @return {Object} AdSense report data with zeroed data.
 */
export function replaceValuesInAdSenseReportWithZeroData(
	report: AdSenseReport
): AdSenseReport {
	function zeroValue( cell: AdSenseReportCell ): AdSenseReportCell {
		return { ...cell, value: 0 };
	}

	let clonedReport: AdSenseReport = { ...report };

	const { totals, rows } = clonedReport;
	const { cells } = totals;

	clonedReport = {
		...clonedReport,
		totals: {
			cells: cells.map( zeroValue ),
		},
		rows: rows.map( ( row ) => ( {
			...row,
			cells: row.cells.map( ( cell, index ) => {
				if ( index !== 0 ) {
					return zeroValue( cell );
				}
				return cell;
			} ),
		} ) ),
	};

	return clonedReport;
}

/**
 * Returns an Search Console report with zeroed data.
 *
 * @since 1.145.0 Moved from `stories/module-search-console-components.stories.js`.
 *
 * @param {Object} report  Search Console report data.
 * @param {Object} options Search Console report options.
 * @return {Object} Search Console report data with zeroed data.
 */
export function replaceValuesInSearchConsoleReportWithZeroData(
	report: SearchConsoleReportRow[],
	options: SearchConsoleReportOptions
): SearchConsoleReportRow[] {
	if ( options.dimensions === 'query' ) {
		return [];
	}

	return report.map( ( row ) => ( {
		...row,
		clicks: 0,
		ctr: 0,
		impressions: 0,
		position: 0,
	} ) );
}
