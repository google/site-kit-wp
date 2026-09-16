/**
 * Scaled typography styles for the PDF export (@react-pdf/renderer).
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
 * Internal dependencies
 */
import { createPDFStyles } from './pdf-scale';
import { PDF_FONT_FAMILY_DISPLAY, PDF_FONT_FAMILY_TEXT } from './pdf-theme';

/**
 * The typography in pixels, before the page scale.
 *
 * `@react-pdf` can't read the dashboard's CSS, so each entry copies
 * `$typography-settings` and `$typography-font-families` from
 * `assets/sass/components/global/_googlesitekit-typography.scss`. The PDF
 * text then reads the same as the dashboard.
 */
const UNSCALED_TYPOGRAPHY = {
	display: {
		small: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 38,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.158,
		},
		medium: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 46,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.13,
		},
		large: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 58,
			fontWeight: 400,
			letterSpacing: -0.25,
			lineHeight: 1.1,
		},
	},
	headline: {
		small: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 22,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.27,
		},
		medium: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 28,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.286,
		},
		large: {
			fontFamily: PDF_FONT_FAMILY_DISPLAY,
			fontSize: 32,
			fontWeight: 400,
			letterSpacing: 0,
			lineHeight: 1.25,
		},
	},
	title: {
		small: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 14,
			fontWeight: 500,
			letterSpacing: -0.1,
			lineHeight: 1.14,
		},
		medium: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 16,
			fontWeight: 500,
			letterSpacing: 0.1,
			lineHeight: 1.25,
		},
		large: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 18,
			fontWeight: 500,
			letterSpacing: 0,
			lineHeight: 1.33,
		},
	},
	body: {
		small: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 12,
			fontWeight: 400,
			letterSpacing: 0.2,
			lineHeight: 1.33,
		},
		medium: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 14,
			fontWeight: 400,
			letterSpacing: 0.25,
			lineHeight: 1.43,
		},
		large: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 16,
			fontWeight: 400,
			letterSpacing: 0.5,
			lineHeight: 1.5,
		},
	},
	label: {
		small: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 12,
			fontWeight: 500,
			letterSpacing: 0.2,
			lineHeight: 1.33,
		},
		medium: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 14,
			fontWeight: 500,
			letterSpacing: 0,
			lineHeight: 1.43,
		},
		large: {
			fontFamily: PDF_FONT_FAMILY_TEXT,
			fontSize: 16,
			fontWeight: 500,
			letterSpacing: 0,
			lineHeight: 1.5,
		},
	},
} as const;

/**
 * Complete text styles for each typography type and size.
 *
 * Each entry holds the font family, size, weight, letter spacing, and line
 * height, ready to apply to a `<Text>`. The PDF page is measured in points
 * and is narrower than the dashboard's pixel values assume, so
 * `createPDFStyles` scales the font size and letter spacing down to page
 * points. The line height is a ratio and the weight is a keyword, so both
 * apply as they are.
 *
 * This lives apart from `pdf-theme.ts` because building it calls
 * `createPDFStyles`, which imports `@react-pdf/renderer`. Keeping it here means
 * the plain constants in `pdf-theme.ts` can be imported by eagerly-loaded code
 * (such as the widgets' `getPDFData` loaders) without pulling `@react-pdf` into
 * the initial vendor chunk.
 *
 * @since 1.183.0
 */
export const PDF_TYPOGRAPHY = {
	display: createPDFStyles( UNSCALED_TYPOGRAPHY.display ),
	headline: createPDFStyles( UNSCALED_TYPOGRAPHY.headline ),
	title: createPDFStyles( UNSCALED_TYPOGRAPHY.title ),
	body: createPDFStyles( UNSCALED_TYPOGRAPHY.body ),
	label: createPDFStyles( UNSCALED_TYPOGRAPHY.label ),
} as const;
