/**
 * Shared pie chart colour palette for the PDF export (@react-pdf/renderer).
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
 * Ordered colors for the PDF report's donut breakdowns.
 *
 * The PDF passes this array to Google Charts as the donut's `colors` option and
 * reuses the same color for each legend swatch, so a segment and its legend
 * entry always match. The colors and their order mirror the dashboard's All
 * Traffic widget, so the same dimension reads the same in both surfaces. Keep
 * this list in step with the dashboard palette in `usePieChartSlices`.
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
