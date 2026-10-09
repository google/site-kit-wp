/**
 * Recent activity insight utilities.
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
 * Internal dependencies
 */
import { ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { addDaysToDate, calculateChange } from '@/js/util';

/**
 * How far the date range's visitors can move from the median of the
 * comparison windows, as a share of the median, and still read as typical.
 */
export const INSIGHT_THRESHOLD = 0.25;

/**
 * How many weeks before the date range each comparison window starts. Whole
 * weeks keep every comparison window on the same weekdays as the date range.
 */
export const INSIGHT_COMPARISON_WEEK_OFFSETS = [ 1, 2, 3, 4 ];

export type InsightClassification = 'typical' | 'up' | 'down';

export interface Insight {
	/** How the date range's visitors compare to the median of the comparison windows. */
	classification: InsightClassification;
	/** The change from the median to the date range's visitors, in percent, e.g. `-32.5`. */
	changePercent: number;
}

export interface ClassifyInsightOptions {
	/** The rows of a `totalUsers` by `date` report that holds the date range and every comparison window. */
	rows?: ReportRow[];
	/** The first day of the date range, e.g. `2025-02-03`. */
	startDate: string;
	/** The last day of the date range, e.g. `2025-02-05`. */
	endDate: string;
}

/**
 * Gets the days of a date range as the `date` dimension values the report
 * returns for them, e.g. `20250203`.
 *
 * @since n.e.x.t
 *
 * @param {string} startDate The first day of the date range, as `YYYY-MM-DD`.
 * @param {string} endDate   The last day of the date range, as `YYYY-MM-DD`.
 * @return {Array<string>} The `date` dimension values, from the first day to the last day.
 */
export function getDateDimensionValues(
	startDate: string,
	endDate: string
): string[] {
	const values = [];

	for (
		let date = startDate;
		date <= endDate;
		date = addDaysToDate( date, 1 )
	) {
		values.push( date.replace( /-/g, '' ) );
	}

	return values;
}

/**
 * Gets the median of a list of numbers.
 *
 * @since n.e.x.t
 *
 * @param {Array<number>} values The numbers.
 * @return {number} The median.
 */
function getMedian( values: number[] ): number {
	const sorted = [ ...values ].sort( ( a, b ) => a - b );
	const middle = Math.floor( sorted.length / 2 );

	return sorted.length % 2
		? sorted[ middle ]
		: ( sorted[ middle - 1 ] + sorted[ middle ] ) / 2;
}

/**
 * Classifies the visitors of the Recent activity date range against the same
 * days in each of the previous four weeks.
 *
 * The baseline is the median of the four comparison windows, so a single
 * unusual week does not move it.
 *
 * @since n.e.x.t
 *
 * @param {Object}        options           Options.
 * @param {Array<Object>} [options.rows]    The rows of a `totalUsers` by `date` report.
 * @param {string}        options.startDate The first day of the date range.
 * @param {string}        options.endDate   The last day of the date range.
 * @return {Object|null} The classification and the change in percent, or `null` when the date range has no visitors, when a comparison window has no visitors, or when the median is `0`.
 */
export function classifyInsight( {
	rows = [],
	startDate,
	endDate,
}: ClassifyInsightOptions ): Insight | null {
	const visitorsByDate = new Map< string, number >();

	rows.forEach( ( { dimensionValues, metricValues } ) => {
		const date = dimensionValues?.[ 0 ]?.value;

		if ( date ) {
			visitorsByDate.set(
				date,
				Number( metricValues?.[ 0 ]?.value ) || 0
			);
		}
	} );

	function sumVisitors( windowStartDate: string, windowEndDate: string ) {
		return getDateDimensionValues( windowStartDate, windowEndDate ).reduce(
			( total, date ) => total + ( visitorsByDate.get( date ) || 0 ),
			0
		);
	}

	const current = sumVisitors( startDate, endDate );

	if ( current === 0 ) {
		return null;
	}

	const comparisonTotals = INSIGHT_COMPARISON_WEEK_OFFSETS.map( ( weeks ) =>
		sumVisitors(
			addDaysToDate( startDate, weeks * -7 ),
			addDaysToDate( endDate, weeks * -7 )
		)
	);

	// The report has a row for every day, with `0` for a day without
	// visitors. So a comparison window without visitors is how a week the
	// property has no data for shows up.
	if ( comparisonTotals.some( ( total ) => total === 0 ) ) {
		return null;
	}

	// `calculateChange()` gives `null` when the median is `0`.
	const change = calculateChange( getMedian( comparisonTotals ), current );

	if ( change === null ) {
		return null;
	}

	let classification: InsightClassification = 'typical';
	if ( change > INSIGHT_THRESHOLD ) {
		classification = 'up';
	} else if ( change < -INSIGHT_THRESHOLD ) {
		classification = 'down';
	}

	return { classification, changePercent: change * 100 };
}
