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
import {
	BenchmarkingAvailability,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';

export type TypicalTrafficAvailability = Pick<
	BenchmarkingAvailability,
	| 'keyFactorsAvailable'
	| 'insightRequestAllowed'
	| 'performanceInsightAvailable'
>;

/**
 * The parts of the typical traffic view while the benchmarking response loads:
 * every part, so each keeps its placeholder until the response says otherwise.
 */
const AVAILABILITY_WHILE_LOADING: TypicalTrafficAvailability = {
	keyFactorsAvailable: true,
	insightRequestAllowed: true,
	performanceInsightAvailable: true,
};

/**
 * Gets which parts of the typical traffic view the selected date range has.
 *
 * The server decides them by the rules of the Site Kit service's
 * `TypicalTrafficAvailabilityFor()`, which `Typical_Traffic_Availability`
 * ports, and sends them with the benchmarking response, so the panel reads
 * them rather than working them out again.
 *
 * @since n.e.x.t
 *
 * @param {Object} [benchmarkingResponse] Optional. The benchmarking response for the selected date range, or `undefined` while it loads.
 * @return {Object} Whether the range has the key factors, whether the panel asks for the generated insight, and whether it shows the insight's analysis. Every part is `true` while the response loads.
 */
export function getTypicalTrafficAvailability(
	benchmarkingResponse?: DecodedBenchmarkingResponse
): TypicalTrafficAvailability {
	return benchmarkingResponse?.availability ?? AVAILABILITY_WHILE_LOADING;
}
