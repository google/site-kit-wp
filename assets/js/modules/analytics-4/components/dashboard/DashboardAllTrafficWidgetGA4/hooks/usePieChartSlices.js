/**
 * `usePieChartSlices()` custom hook for the `UserDimensionsPieChart` component.
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
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

const PIE_CHART_COLORS = [
	'#fece72',
	'#a983e6',
	'#bed4ff',
	'#ee92da',
	'#ff9b7a',
];

// This is the fallback color for dimension values that are not in the `PIE_CHART_COLORS` array.
// In practice, we should never reach this fallback color.
const FALLBACK_COLOR = '#ccc';

/**
 * Gets the pie chart slices for the given dimension values.
 *
 * This hook caches the colors for the dimension values and returns them when the
 * same dimension values are passed in again.
 *
 * @since n.e.x.t
 *
 * @return {Function} A function that returns the pie chart slices for the given dimension values.
 */
export default function usePieChartSlices() {
	const dimensionValueColorsRef = useRef( {} );

	function getDimensionValueColor( dimensionValue ) {
		const colors = dimensionValueColorsRef.current;

		if ( colors[ dimensionValue ] ) {
			return colors[ dimensionValue ];
		}

		const usedColors = Object.values( colors );

		const availableColor =
			PIE_CHART_COLORS.find(
				( color ) => ! usedColors.includes( color )
			) || FALLBACK_COLOR;

		colors[ dimensionValue ] = availableColor;

		return availableColor;
	}

	function getPieChartSlices( dimensionValues ) {
		// Remove cached colors for dimension values that are not in the new dimension values array,
		// to avoid running out of colors.
		Object.keys( dimensionValueColorsRef.current ).forEach(
			( dimensionValue ) => {
				if ( ! dimensionValues.includes( dimensionValue ) ) {
					delete dimensionValueColorsRef.current[ dimensionValue ];
				}
			}
		);

		// Get slices for new dimension values.
		return dimensionValues.reduce( ( slices, dimensionValue, index ) => {
			slices[ index ] = {
				color: getDimensionValueColor( dimensionValue ),
			};
			return slices;
		}, {} );
	}

	return getPieChartSlices;
}
