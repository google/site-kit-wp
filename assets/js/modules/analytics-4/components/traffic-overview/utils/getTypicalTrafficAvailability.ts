/**
 * Traffic Overview `getTypicalTrafficAvailability` utility.
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
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import { hasTypicalTrafficRange } from './hasTypicalTrafficRange';

/**
 * The fewest days a date range needs for its key factors and the generated
 * insight: one whole week.
 */
export const MIN_KEY_FACTOR_DAYS = 7;

export interface TypicalTrafficAvailabilityOptions {
	/** The benchmarking response for the selected date range, or `undefined` while it loads. */
	benchmarkingResponse?: DecodedBenchmarkingResponse;
	/** The first day of the date range before the selected one, as `YYYY-MM-DD`. */
	compareStartDate: string;
	/** The number of days in the selected date range. */
	daysInRange: number;
}

export interface TypicalTrafficAvailability {
	/** Whether the panel shows the key factors: the date range has at least 7 days, and every day of the range before it has recorded traffic. */
	keyFactorsAvailable: boolean;
	/** Whether every day of the date range has its typical range, so the chart draws the band. */
	bandAvailable: boolean;
	/** Whether the panel asks for the generated insight: with the key factors, since the insight's driver describes the change they show. */
	insightRequestAllowed: boolean;
	/** Whether the panel shows the insight's analysis, which compares the visits with the typical range: with the band and the request. */
	performanceInsightAvailable: boolean;
}

/**
 * Gets which parts of the typical traffic view the selected date range has.
 *
 * These are the rules of the Site Kit service's
 * `TypicalTrafficAvailabilityFor()`, which `Typical_Traffic_Availability`
 * ports for the benchmarking response. The response has the key factors only
 * once every day of the date range before the selected one has recorded
 * traffic, and the typical range on every day of the range or on none of them,
 * so the panel reads both from it. Without the band, the service would write
 * an analysis that says it's still learning what's usual for the site, which
 * the panel leaves out.
 *
 * @since n.e.x.t
 *
 * @param {Object} options                        Options.
 * @param {Object} [options.benchmarkingResponse] Optional. The benchmarking response for the selected date range, or `undefined` while it loads.
 * @param {string} options.compareStartDate       The first day of the date range before the selected one, as `YYYY-MM-DD`.
 * @param {number} options.daysInRange            The number of days in the selected date range.
 * @return {Object} Whether the range has the key factors and the band, whether the panel asks for the generated insight, and whether it shows the insight's analysis. Every part is `true` while the response loads, so each keeps its placeholder until the response says otherwise.
 */
export function getTypicalTrafficAvailability( {
	benchmarkingResponse,
	compareStartDate,
	daysInRange,
}: TypicalTrafficAvailabilityOptions ): TypicalTrafficAvailability {
	if ( ! benchmarkingResponse ) {
		return {
			keyFactorsAvailable: true,
			bandAvailable: true,
			insightRequestAllowed: true,
			performanceInsightAvailable: true,
		};
	}

	const { firstTrafficDate, dailyTraffic } = benchmarkingResponse;

	// The previous range is in the site's history when the site's first day
	// with recorded traffic is on or before the range's first day.
	const keyFactorsAvailable =
		daysInRange >= MIN_KEY_FACTOR_DAYS &&
		!! firstTrafficDate &&
		firstTrafficDate <= compareStartDate;
	const bandAvailable = hasTypicalTrafficRange( dailyTraffic );

	return {
		keyFactorsAvailable,
		bandAvailable,
		insightRequestAllowed: keyFactorsAvailable,
		performanceInsightAvailable: bandAvailable && keyFactorsAvailable,
	};
}
