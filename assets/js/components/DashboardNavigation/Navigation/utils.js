/**
 * Navigation utilities.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import {
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_TRAFFIC,
} from '../../../googlesitekit/constants';

/**
 * Gets the default chip ID based on the visibility of various sections.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                   Section visibility options.
 * @param {Object}  options.visibleSections   An object mapping visible sections to their IDs.
 * @param {boolean} options.viewOnlyDashboard If the dashboard is in view-only mode.
 * @return {string} The default chip ID.
 */
export function getDefaultChipID( { visibleSections, viewOnlyDashboard } ) {
	if ( visibleSections.includes( ANCHOR_ID_KEY_METRICS ) ) {
		return ANCHOR_ID_KEY_METRICS;
	}

	if ( ! viewOnlyDashboard ) {
		return ANCHOR_ID_TRAFFIC;
	}

	return visibleSections[ 0 ] || '';
}
