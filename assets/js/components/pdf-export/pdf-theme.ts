/**
 * Shared theme constants for the PDF export (@react-pdf/renderer).
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

/**
 * The `@react-pdf` family name for display and headline text.
 *
 * `registerPDFFonts()` registers Google Sans Display under it, at regular
 * 400 and medium 500.
 *
 * @since 1.182.0
 */
export const PDF_FONT_FAMILY_DISPLAY = 'GoogleSansDisplay';

/**
 * The `@react-pdf` family name for title, body, and label text.
 *
 * `registerPDFFonts()` registers Google Sans Text under it, at regular 400
 * and medium 500.
 *
 * @since 1.182.0
 */
export const PDF_FONT_FAMILY_TEXT = 'GoogleSansText';

/**
 * Shared colors for the PDF report.
 *
 * `@react-pdf` builds the PDF from JavaScript values and can't read the
 * dashboard's CSS. So each color lives here as a copy: the key is a Sass
 * token name from `assets/sass/config/_variables-mui3.scss`, and the value
 * is that token's hex.
 *
 * @since n.e.x.t
 */
export const PDF_COLORS = {
	SURFACES_ON_SURFACE: '#161b18', // $c-surfaces-on-surface
	SURFACES_ON_SURFACE_VARIANT: '#6c726e', // $c-surfaces-on-surface-variant
	CONTENT_SECONDARY: '#108080', // $c-content-secondary
	SURFACES_SURFACE_1: '#ebeef0', // $c-surfaces-surface-1
	SURFACES_BACKGROUND: '#f3f5f7', // $c-surfaces-background
	SURFACES_SURFACE: '#ffffff', // $c-surfaces-surface
	GREEN_G_50: '#d8ffc0', // $c-green-g-50
	UTILITY_ON_SUCCESS_CONTAINER: '#1f4c04', // $c-utility-on-success-container
	UTILITY_ERROR_CONTAINER: '#ffded3', // $c-utility-error-container
	UTILITY_ON_ERROR_CONTAINER: '#7a1e00', // $c-utility-on-error-container
	VIOLET_V_50: '#e3d1ff', // $c-violet-v-50
	VIOLET_V_600: '#462083', // $c-violet-v-600
	YELLOW_Y_50: '#ffe4b1', // $c-yellow-y-50
	YELLOW_Y_500: '#895a00', // $c-yellow-y-500
	BLUE_B_400: '#6380b8', // $c-blue-b-400
	TEAL_T_300: '#4bbbbb', // $c-teal-t-300
	SITE_KIT_SK_500: '#3c7251', // $c-site-kit-sk-500
	VIOLET_V_300: '#8e68cb', // $c-violet-v-300
	YELLOW_Y_100: '#fece72', // $c-yellow-y-100
	VIOLET_V_200: '#a983e6', // $c-violet-v-200
	BLUE_B_100: '#bed4ff', // $c-blue-b-100
	PINK_P_200: '#ee92da', // $c-pink-p-200
	RED_R_200: '#ff9b7a', // $c-red-r-200
} as const;

/**
 * Donut chart colors for the PDF report, in slice order.
 *
 * Each slice and its legend row read the same color from this list, so they
 * always match. The list matches the dashboard's donut colors, so each donut
 * looks the same in the dashboard and the PDF.
 *
 * @since n.e.x.t
 */
export const PIE_CHART_COLORS = [
	PDF_COLORS.YELLOW_Y_100,
	PDF_COLORS.VIOLET_V_200,
	PDF_COLORS.BLUE_B_100,
	PDF_COLORS.PINK_P_200,
	PDF_COLORS.RED_R_200,
];

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
 * @since n.e.x.t
 */
export const PDF_TYPOGRAPHY = {
	display: createPDFStyles( UNSCALED_TYPOGRAPHY.display ),
	headline: createPDFStyles( UNSCALED_TYPOGRAPHY.headline ),
	title: createPDFStyles( UNSCALED_TYPOGRAPHY.title ),
	body: createPDFStyles( UNSCALED_TYPOGRAPHY.body ),
	label: createPDFStyles( UNSCALED_TYPOGRAPHY.label ),
} as const;
