/**
 * DashboardAllTrafficWidgetGA4 utility functions.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '../../../../../components/Link';

/**
 * Creates a GA4 report row for the given date, with a zero for the metric value.
 *
 * @since 1.96.0
 *
 * @param {string} date Date in YYYY-MM-DD format.
 * @return {Object} Row object with the date in the GA4 report format as the dimension value, and a zero for the metric value.
 */
export function createZeroDataRow( date ) {
	// Note, this uses `replace()` rather than `replaceAll()` as our current version of Node does not support `replaceAll()`.
	// TODO: Replace with `replaceAll()` when we upgrade to Node 15+.
	return {
		dimensionValues: [
			{
				value: date.replace( new RegExp( '-', 'g' ), '' ),
			},
		],
		metricValues: [
			{
				value: 0,
			},
		],
	};
}
/**
 * Gets HTML string for a tooltip help link.
 *
 * @since 1.116.0
 *
 * @param {string} url      The URL to link to.
 * @param {string} label    The label for the link.
 * @param {string} rowLabel The label for the row.
 * @return {string} The HTML string for the tooltip help link.
 */
export const getTooltipHelp = ( url, label, rowLabel ) =>
	renderToString(
		<p>
			<Link
				className="googlesitekit-cta-link__tooltip"
				external
				href={ url }
				data-row-label={ rowLabel }
			>
				{ label }
			</Link>
		</p>
	);
