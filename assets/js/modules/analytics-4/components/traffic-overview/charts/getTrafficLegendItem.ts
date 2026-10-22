/**
 * Traffic Overview `getTrafficLegendItem` utility.
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
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ChartLegendItem } from './ChartLegend';
import { TRAFFIC_CHART_LINE_COLOR } from './trafficChartOptions';

/**
 * Gets the legend item for the line of daily visitors, with a label such as
 * "Last 28 days traffic".
 *
 * @since n.e.x.t
 *
 * @param {number} daysInSelectedRange The number of days in the selected date range, which the label names and which picks between its singular and plural forms.
 * @return {Object} The legend item's label, and the color of the line.
 */
export function getTrafficLegendItem(
	daysInSelectedRange: number
): ChartLegendItem {
	return {
		label: sprintf(
			/* translators: %d: the number of days in the selected date range, such as "28" */
			_n(
				'Last %d day traffic',
				'Last %d days traffic',
				daysInSelectedRange,
				'google-site-kit'
			),
			daysInSelectedRange
		),
		color: TRAFFIC_CHART_LINE_COLOR,
	};
}
