/**
 * Traffic Overview `getDailyTrafficFromReport` utility.
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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';
import parseDimensionStringToDate from '@/js/modules/analytics-4/utils/parseDimensionStringToDate';
import { getDateString, stringToDate } from '@/js/util';
import { getMetricValue } from './getMetricValue';

/**
 * Gets the visits on each day of the selected range from the daily visits
 * report, in the shape the Traffic Overview chart plots.
 *
 * The report leaves out a day without visits, so that day reads zero. No day
 * has a typical range.
 *
 * @since n.e.x.t
 *
 * @param {Object} [report]  Optional. The daily visits report, `undefined` until the request has finished.
 * @param {string} startDate The range's first day, as `YYYY-MM-DD`.
 * @param {string} endDate   The range's last day, as `YYYY-MM-DD`.
 * @return {Array.<Object>} One row for each day of the range, oldest first, each with null bounds.
 */
export function getDailyTrafficFromReport(
	report: Report | undefined,
	startDate: string,
	endDate: string
): BenchmarkingDailyTrafficRow[] {
	const visitsByDate = new Map< string, number >();

	report?.rows?.forEach( ( row ) => {
		const date = parseDimensionStringToDate(
			row.dimensionValues?.[ 0 ]?.value ?? ''
		);

		if ( date instanceof Date ) {
			visitsByDate.set( getDateString( date ), getMetricValue( row ) );
		}
	} );

	const dailyTraffic: BenchmarkingDailyTrafficRow[] = [];

	// The date walks a day at a time, like the dates of the decoded
	// benchmarking response, so a daylight-saving change inside the range skips
	// no day.
	for (
		const date = stringToDate( startDate );
		getDateString( date ) <= endDate;
		date.setDate( date.getDate() + 1 )
	) {
		const dateString = getDateString( date );

		dailyTraffic.push( {
			date: dateString,
			visits: visitsByDate.get( dateString ) ?? 0,
			expectedMin: null,
			expectedMax: null,
		} );
	}

	return dailyTraffic;
}
