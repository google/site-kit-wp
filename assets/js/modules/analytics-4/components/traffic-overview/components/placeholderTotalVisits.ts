/**
 * Placeholder total visits.
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
import { BenchmarkingVisits } from '@/js/modules/analytics-4/utils/benchmarking/types';

/**
 * The visits the Traffic Overview panel shows as its total visits until it
 * reads them from the benchmarking response. They make the figure and the
 * change of the design: 1.2K, up 12.1% on the range before.
 *
 * @since n.e.x.t
 */
export const PLACEHOLDER_TOTAL_VISITS: BenchmarkingVisits = {
	current: 1234,
	previous: 1101,
};
