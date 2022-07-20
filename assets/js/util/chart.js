/**
 * Utility functions for charts.
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
 * @since 1.30.0
 *
 * @param {number}  difference            The difference which can be positive or negative.
 * @param {string}  [options]             Options to be passed to the ChangeArrow component.
 * @param {boolean} [options.invertColor] Whether we need to reverse the +/- colors of the arrow.
 * @return {string} SVG for the +/- difference.
 */
export const getChartDifferenceArrow = ( difference, options = {} ) => {
	if ( Number.isNaN( Number( difference ) ) ) {
		return '';
	}
	const { invertColor = false } = options;

	return renderToString(
		<ChangeArrow
			direction={ difference > 0 ? 'up' : 'down' }
			invertColor={ invertColor }
		/>
	);
};

/**
 * Checks if there is a single row of data or one row is contributing 100% of the total for a given dimension.
 *
 * @since 1.31.0
 *
 * @param {Array.<Object>} report An array of report data objects.
 * @return {(boolean|undefined)} Returns undefined if report is undefined, true/false for the above conditions.
 */
export const isSingleSlice = ( report ) => {
	if ( report === undefined ) {
		return undefined;
	}

	if (
		report?.[ 0 ]?.data?.rows?.length === 1 ||
		report?.[ 0 ]?.data?.rows?.[ 0 ]?.metrics?.[ 0 ]?.values?.[ 0 ] ===
			report?.[ 0 ]?.data?.totals?.[ 0 ]?.values?.[ 0 ]
	) {
		return true;
	}

	return false;
};

/**
 * Calculates difference between two chart values.
 *
 * @since 1.48.0
 *
 * @param {number} currentValue  Current chart value.
 * @param {number} previousValue Previous chart value.
 * @return {number} The difference.
 */
export const calculateDifferenceBetweenChartValues = (
	currentValue,
	previousValue
) => {
	if ( currentValue > 0 && previousValue > 0 ) {
		return currentValue / previousValue - 1;
	}
	if ( currentValue > 0 ) {
		return 1;
	}
	if ( previousValue > 0 ) {
		return -1;
	}
	return 0;
};

/**
 * Returns a font name only if the Google Web Font loader script isn't loaded.
 *
 * @since n.e.x.t
 *
 * @param {string=} fontName Optional. Font name string to return. Defaults to `'Google Sans Text`.
 * @return {string|undefined} The font string supplied if `WebFont` is not set. `undefined` if the `WebFont` global is set.
 */
export const chartFontName = ( fontName = 'Google Sans Text' ) => {
	// If the Google `WebFont` global exists and we try to use
	// the `fontName` property in a Google Chart, we'll encounter an
	// exception and the entire dashboard will crash.
	//
	// Our "workaround" is not to load custom fonts when the `WebFont`
	// global exists, as these are usually very small UI elements
	// and there's no clear way to get them to load without errors
	// when the `WebFont` global/script is loaded.
	//
	// See: https://github.com/google/site-kit-wp/issues/5572
	if ( typeof WebFont !== 'undefined' ) {
		return undefined;
	}

	return fontName;
};
