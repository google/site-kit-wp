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
import { scalePDFValue } from './pdf-scale';

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
 * The page height, in points, for the measurement render pass.
 *
 * Tall enough to hold any report on one page without pagination, while
 * staying under the PDF specification's hard page-size limit.
 *
 * @since 1.185.0
 */
export const PDF_MEASURE_PAGE_HEIGHT = 14400;

/**
 * The padding under the footer links, in points.
 *
 * The Figma design sets the padding to 44 frame pixels, and `scalePDFValue`
 * converts that length to points. The final page height is the measured
 * height plus the padding.
 *
 * @since 1.185.0
 */
export const PDF_PAGE_BOTTOM_PADDING = scalePDFValue( 44 );

/**
 * Shared colors for the PDF report.
 *
 * `@react-pdf` builds the PDF from JavaScript values and can't read the
 * dashboard's CSS. So each color lives here as a copy: the key is a Sass
 * token name from `assets/sass/config/_variables-mui3.scss`, and the value
 * is that token's hex.
 *
 * @since 1.183.0
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
	SURFACES_INVERSE_ON_SURFACE: '#ebeef0', // $c-surfaces-inverse-on-surface
	NEUTRAL_N_700: '#333935', // $c-neutral-n-700
	VIOLET_V_50: '#e3d1ff', // $c-violet-v-50
	VIOLET_V_600: '#462083', // $c-violet-v-600
	YELLOW_Y_50: '#ffe4b1', // $c-yellow-y-50
	YELLOW_Y_500: '#895a00', // $c-yellow-y-500
	YELLOW_Y_600: '#684500', // $c-yellow-y-600
	UTILITY_WARNING_CONTAINER: '#ffe4b1', // $c-utility-warning-container
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
 * @since 1.184.0
 */
export const PIE_CHART_COLORS = [
	PDF_COLORS.YELLOW_Y_100,
	PDF_COLORS.VIOLET_V_200,
	PDF_COLORS.BLUE_B_100,
	PDF_COLORS.PINK_P_200,
	PDF_COLORS.RED_R_200,
];
