/**
 * Shared colors for the PDF report's donut breakdowns.
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
 * The colors for the donut breakdowns, in slice order.
 *
 * The PDF report sends this list to Google Charts as the donut's `colors`
 * option, and it gives each legend swatch the same color. So a donut segment
 * and its legend row always share one color. The colors and their order are the
 * same as the dashboard's All Traffic widget, so each dimension looks the same
 * in the dashboard and the PDF. Keep this list the same as the dashboard colors
 * in `usePieChartSlices`.
 *
 * @since n.e.x.t
 */
export const PIE_CHART_COLORS = [
	'#fece72',
	'#a983e6',
	'#bed4ff',
	'#ee92da',
	'#ff9b7a',
];
