/**
 * Traffic Overview `hasTypicalTrafficRange` utility.
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
import { BenchmarkingDailyTrafficRow } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * Checks whether every day of the daily traffic has its typical range.
 *
 * The typical range covers every day of a date range or none of them, so the
 * chart draws its band, and the panel shows the analysis that compares the
 * visits with it, only when every day has one.
 *
 * @since n.e.x.t
 *
 * @param {Array} [dailyTraffic] Optional. The visits on each day of the date range, each with the bounds of the day's typical range, or null bounds on a day without one.
 * @return {boolean} True when there is a day and every day has both bounds, false otherwise.
 */
export function hasTypicalTrafficRange(
	dailyTraffic: BenchmarkingDailyTrafficRow[] = []
): boolean {
	return (
		dailyTraffic.length > 0 &&
		dailyTraffic.every(
			( { expectedMin, expectedMax } ) =>
				expectedMin !== null && expectedMax !== null
		)
	);
}
