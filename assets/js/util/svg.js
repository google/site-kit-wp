/**
 * Utility functions for SVGs.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import ChangeArrow from '../components/ChangeArrow';

/**
 * Gets the up/down SVG arrow for Google Chart tooltips.
 *
 * @since n.e.x.t
 *
 * @param {number}  difference  The difference which can be positive or negative.
 * @param {boolean} invertColor Whether we need to reverse the +/- colors.
 * @return {string} SVG for the +/- difference.
 */
export const getChartDifferenceArrow = ( difference, invertColor = false ) => {
	if ( Number.isNaN( Number( difference ) ) ) {
		return '';
	}

	return renderToString(
		<ChangeArrow direction={ difference > 0 ? 'up' : 'down' } invertColor={ invertColor } />
	);
};
