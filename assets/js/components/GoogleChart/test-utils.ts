/**
 * GoogleChart test utility functions.
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
import { getDateString } from '@/js/util';

/**
 * Builds a mock Google Charts chart wrapper. Its chart layout puts each given
 * day at the given position.
 *
 * @since n.e.x.t
 *
 * @param {Object} xLocations       The position of each day, keyed by the day as `YYYY-MM-DD`.
 * @param {Object} chartArea        The chart area.
 * @param {number} chartArea.top    The chart area's distance from the top of the chart.
 * @param {number} chartArea.height The chart area's height.
 * @return {Object} The mock chart wrapper.
 */
export function createChartWrapper(
	xLocations: Record< string, number >,
	chartArea: { top: number; height: number }
) {
	return {
		getChart: () => ( {
			getChartLayoutInterface: () => ( {
				getChartAreaBoundingBox: () => chartArea,
				getXLocation: ( day: Date ) =>
					xLocations[ getDateString( day ) ],
			} ),
		} ),
	};
}
