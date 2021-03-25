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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Gets the up/down SVG arrow for Google Chart tooltips.
 *
 * @since n.e.x.t
 *
 * @param {number} difference The difference which can be positive or negative.
 * @return {string} SVG for the +/- difference.
 */
export const getChartDifferenceArrow = ( difference ) => {
	if ( Number.isNaN( Number( difference ) ) ) {
		return false;
	}

	return (
		`<svg width="9" height="9" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" class="${ classnames( 'googlesitekit-change-arrow', {
			'googlesitekit-change-arrow--up': difference > 0,
			'googlesitekit-change-arrow--down': difference < 0,
		} ) }">
			<path d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z" fill="currentColor" />
		</svg>`
	);
};
