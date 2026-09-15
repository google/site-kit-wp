/**
 * Traffic Overview test utility functions.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';

/**
 * Builds a breakdown report from label and visitor pairs, in the order given.
 *
 * The visitors are strings, the way the API returns them.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ label, visitors ]` pairs.
 * @return {Object} The breakdown report.
 */
export function createBreakdownReport(
	pairs: Array< [ string, number ] >
): Report {
	return {
		rows: pairs.map( ( [ label, visitors ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
	};
}

/**
 * Builds a daily-visitors report from day and visitor pairs.
 *
 * The values are strings, as the API returns them.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} days `[ 'YYYY-MM-DD', visitors ]` pairs, in the order the report returns them.
 * @return {Object} The report, with one row per day and the sum of the days as its total.
 */
export function createDailyVisitorsReport(
	days: Array< [ string, number ] >
): Report {
	const totalUsers = days.reduce(
		( sum, [ , visitors ] ) => sum + visitors,
		0
	);

	return {
		rows: days.map( ( [ date, visitors ] ) => ( {
			dimensionValues: [ { value: date.replace( /-/g, '' ) } ],
			metricValues: [ { value: String( visitors ) } ],
		} ) ),
		totals: [ { metricValues: [ { value: String( totalUsers ) } ] } ],
	};
}

/**
 * Builds a totals report with the selected range then the range before it.
 *
 * The values are strings, the way the API returns them.
 *
 * @since n.e.x.t
 *
 * @param {number} currentValue  Visitors over the selected range.
 * @param {number} previousValue Visitors over the range before it.
 * @return {Object} The totals report.
 */
export function createTotalsReport(
	currentValue: number,
	previousValue: number
): Report {
	return {
		totals: [
			{ metricValues: [ { value: String( currentValue ) } ] },
			{ metricValues: [ { value: String( previousValue ) } ] },
		],
	};
}
