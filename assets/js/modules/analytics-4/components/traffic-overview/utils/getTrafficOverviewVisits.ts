/**
 * Traffic Overview `getTrafficOverviewVisits` utility.
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
import {
	BenchmarkingDailyTrafficRow,
	BenchmarkingVisits,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { getDailyTrafficFromReport } from './getDailyTrafficFromReport';
import { getMetricValue } from './getMetricValue';

export interface TrafficOverviewVisitsOptions {
	/** The benchmarking response for the selected range, or `undefined` while there is none. */
	benchmarkingResponse?: DecodedBenchmarkingResponse;
	/** Whether the request for the benchmarking response failed. */
	benchmarkingFailed: boolean;
	/** The report of visits on each day of the selected range, against the range before it, which the panel requests when the benchmarking request fails. */
	dailyVisitsReport?: Report;
	/** The first day of the selected range, as `YYYY-MM-DD`. */
	startDate: string;
	/** The last day of the selected range, as `YYYY-MM-DD`. */
	endDate: string;
}

export interface TrafficOverviewVisits {
	/** The visits on each day of the selected range, with its typical range where the source has one. */
	dailyTraffic?: BenchmarkingDailyTrafficRow[];
	/** The visits over the selected range, and over the range before it. */
	totalVisits?: BenchmarkingVisits;
}

/**
 * Gets the visits the Typical Traffic Overview panel draws in its chart and
 * shows as its total visits.
 *
 * The panel reads them from the benchmarking response, and each day of the
 * response carries its typical range, which the chart draws behind the line.
 * When the benchmarking request fails, the daily visits report gives the
 * visits of each day, with no typical range, and the visits over each range in
 * its totals, so the panel keeps its figures.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                        Options.
 * @param {Object}  [options.benchmarkingResponse] Optional. The benchmarking response, or `undefined` while there is none.
 * @param {boolean} options.benchmarkingFailed     Whether the request for the benchmarking response failed.
 * @param {Object}  [options.dailyVisitsReport]    Optional. The daily visits report, or `undefined` until it has arrived.
 * @param {string}  options.startDate              The first day of the selected range, as `YYYY-MM-DD`.
 * @param {string}  options.endDate                The last day of the selected range, as `YYYY-MM-DD`.
 * @return {Object} The visits on each day, and the visits over the selected range and the range before it, each `undefined` until its source has arrived.
 */
export function getTrafficOverviewVisits( {
	benchmarkingResponse,
	benchmarkingFailed,
	dailyVisitsReport,
	startDate,
	endDate,
}: TrafficOverviewVisitsOptions ): TrafficOverviewVisits {
	if ( benchmarkingFailed ) {
		// The report's totals hold the selected range first.
		return {
			dailyTraffic: getDailyTrafficFromReport(
				dailyVisitsReport,
				startDate,
				endDate
			),
			totalVisits: {
				current: getMetricValue( dailyVisitsReport?.totals?.[ 0 ] ),
				previous: getMetricValue( dailyVisitsReport?.totals?.[ 1 ] ),
			},
		};
	}

	return {
		dailyTraffic: benchmarkingResponse?.dailyTraffic,
		totalVisits: benchmarkingResponse?.visits,
	};
}
