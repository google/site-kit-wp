/**
 * Shared scale and style helpers for the PDF report (@react-pdf/renderer).
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
 * External dependencies
 */
import { StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/stylesheet';

/** Width of the PDF page, in points. */
export const PDF_PAGE_WIDTH = 612;

/** Padding from the page edge to the report content, in points. */
export const PDF_PAGE_PADDING = 24;

/** Width of the report content in the Figma design, in pixels. */
export const PDF_FIGMA_CONTENT_WIDTH = 1133;

/**
 * Scale from a Figma content pixel to a PDF page content point.
 *
 * The Figma content is wider than the PDF page, so multiplying a Figma length
 * by this scale gives its length on the PDF page. The scale is the PDF page
 * content width (`PDF_PAGE_WIDTH - 2 * PDF_PAGE_PADDING`) divided by the Figma
 * content width.
 */
export const PDF_SCALE =
	( PDF_PAGE_WIDTH - 2 * PDF_PAGE_PADDING ) / PDF_FIGMA_CONTENT_WIDTH;

/**
 * Style properties whose numeric value is a length.
 *
 * `createPDFStyles` multiplies these values by `PDF_SCALE`. Every other
 * property, such as a color, font family, line height, weight, or flex ratio,
 * keeps its value.
 */
export const PDF_SCALED_PROPERTIES = new Set< string >( [
	// Text.
	'fontSize',
	'letterSpacing',
	// Margin.
	'margin',
	'marginHorizontal',
	'marginVertical',
	'marginTop',
	'marginRight',
	'marginBottom',
	'marginLeft',
	// Padding.
	'padding',
	'paddingHorizontal',
	'paddingVertical',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	// Size.
	'width',
	'height',
	'minWidth',
	'maxWidth',
	'minHeight',
	'maxHeight',
	// Position.
	'top',
	'right',
	'bottom',
	'left',
	// Gap.
	'gap',
	'rowGap',
	'columnGap',
	// Border width.
	'borderWidth',
	'borderTopWidth',
	'borderRightWidth',
	'borderBottomWidth',
	'borderLeftWidth',
	// Border radius.
	'borderRadius',
	'borderTopLeftRadius',
	'borderTopRightRadius',
	'borderBottomRightRadius',
	'borderBottomLeftRadius',
	// Flex.
	'flexBasis',
] );

/**
 * Scales one Figma frame length to a page point value.
 *
 * Use it for a length that a widget sets outside a style object, such as an
 * `Svg` width or height.
 *
 * @since 1.183.0
 *
 * @param {number} value The length, in Figma frame pixels.
 * @return {number} The length, in page points.
 */
export function scalePDFValue( value: number ): number {
	return value * PDF_SCALE;
}

/**
 * Builds scaled @react-pdf styles from Figma frame sizes.
 *
 * A widget writes each style with the sizes from the Figma frame. Each length
 * property in `PDF_SCALED_PROPERTIES` with a numeric value is multiplied by
 * `PDF_SCALE`. A non-numeric value (such as `'100%'`) and every other property
 * keep their values. The scaled styles are passed to `StyleSheet.create`.
 *
 * @since 1.183.0
 *
 * @param {Object} styles Named styles with sizes from the Figma frame.
 * @return {Object} The named styles with each length scaled to points.
 */
export function createPDFStyles< T extends Record< string, Style > >(
	styles: T
): T {
	const scaledStyles: Record< string, Style > = {};

	for ( const [ name, style ] of Object.entries( styles ) ) {
		const scaledStyle: Record< string, unknown > = {};

		for ( const [ property, value ] of Object.entries(
			style as Record< string, unknown >
		) ) {
			scaledStyle[ property ] =
				PDF_SCALED_PROPERTIES.has( property ) &&
				typeof value === 'number'
					? value * PDF_SCALE
					: value;
		}

		scaledStyles[ name ] = scaledStyle as Style;
	}

	return StyleSheet.create( scaledStyles ) as T;
}
