/**
 * Key factors steady traffic helper.
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
import { KEY_FACTORS_DAILY_CHANGE_THRESHOLD } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { BenchmarkingVisits } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * Checks whether traffic was steady: whether every key factor card's visits
 * changed by less than `KEY_FACTORS_DAILY_CHANGE_THRESHOLD` a day, on average
 * over the selected date range, in either direction.
 *
 * @since n.e.x.t
 *
 * @param {Object[]} keyFactors          The key factor cards, each with its visits in the selected date range and in the range before it.
 * @param {number}   daysInSelectedRange The number of days in the selected date range.
 * @return {boolean} Whether traffic was steady. Without cards, there is no change to judge, so it was not.
 */
export function isSteadyTraffic(
	keyFactors: BenchmarkingVisits[],
	daysInSelectedRange: number
): boolean {
	return (
		keyFactors.length > 0 &&
		keyFactors.every(
			( { current, previous } ) =>
				Math.abs( current - previous ) / daysInSelectedRange <
				KEY_FACTORS_DAILY_CHANGE_THRESHOLD
		)
	);
}
