/**
 * Typical Traffic chart options.
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
import { TRAFFIC_CHART_OPTIONS } from './trafficChartOptions';

/**
 * The Google Charts options for the Typical Traffic chart. The line, the value
 * axis, the gridlines, and the crosshair are the Traffic Overview chart's.
 */
export const TYPICAL_TRAFFIC_CHART_OPTIONS = {
	...TRAFFIC_CHART_OPTIONS,
	// The design ends the chart area 28px before the right edge of the chart.
	chartArea: {
		...TRAFFIC_CHART_OPTIONS.chartArea,
		right: 28,
	},
	// The selected-range region sits behind the chart, so the chart draws no
	// background over it.
	backgroundColor: 'transparent',
	hAxis: {
		...TRAFFIC_CHART_OPTIONS.hAxis,
		format: 'MMM',
		// At this spacing, Google Charts shows every month label on a tablet or
		// wider, and every other one on a phone. A smaller spacing hides single
		// labels on some phones, so the gaps between labels stop being equal.
		minTextSpacing: 10,
	},
};
