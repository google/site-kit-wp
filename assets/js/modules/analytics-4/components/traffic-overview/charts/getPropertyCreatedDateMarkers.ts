/**
 * Traffic Overview `getPropertyCreatedDateMarkers` utility.
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
import { __ } from '@wordpress/i18n';

/**
 * A day that `GoogleChart` marks with a dashed line, and the tooltip on the
 * line's icon.
 *
 * @since n.e.x.t
 */
export interface DateMarker {
	/** The day the marker sits on, as `YYYY-MM-DD`. */
	date: string;
	/** The text of the tooltip on the marker's icon. */
	text: string;
}

/**
 * Gets the date marker for the day the Analytics property was created.
 *
 * @since n.e.x.t
 *
 * @param {string} [markerDate] Optional. The day the property was created, as `YYYY-MM-DD`, when the chart plots that day.
 * @return {Array.<Object>|undefined} The marker `GoogleChart` draws, or `undefined` when there is no day to mark.
 */
export function getPropertyCreatedDateMarkers(
	markerDate?: string
): DateMarker[] | undefined {
	if ( ! markerDate ) {
		return undefined;
	}

	return [
		{
			date: markerDate,
			text: __( 'Google Analytics property created', 'google-site-kit' ),
		},
	];
}
