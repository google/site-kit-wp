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
 * Registered @react-pdf font family for display sizes and headings.
 *
 * Maps to Google Sans Display (regular / 400 only).
 */
export const PDF_FONT_FAMILY_DISPLAY = 'GoogleSansDisplay';

/**
 * Registered @react-pdf font family for body text and captions.
 *
 * Maps to Google Sans Text (regular / 400 and medium / 500).
 */
export const PDF_FONT_FAMILY_TEXT = 'GoogleSansText';
export const PDF_COLOR_TEXT_PRIMARY = '#161b18';
export const PDF_COLOR_TEXT_SECONDARY = '#5f6368';
export const PDF_COLOR_TEXT_MUTED = '#6C726E';
export const PDF_COLOR_LINK = '#108080';
export const PDF_COLOR_BORDER = '#dadce0';

/**
 * Header-specific colour tokens for the PDF report header strip.
 *
 * @since n.e.x.t
 */
export const PDF_HEADER_COLORS = {
	logo: PDF_COLOR_TEXT_SECONDARY,
	title: PDF_COLOR_TEXT_PRIMARY,
	subtitle: PDF_COLOR_TEXT_SECONDARY,
	siteURL: PDF_COLOR_TEXT_MUTED,
	link: PDF_COLOR_LINK,
	chipBorder: PDF_COLOR_BORDER,
	chipText: PDF_COLOR_TEXT_PRIMARY,
	chipIcon: PDF_COLOR_TEXT_SECONDARY,
};
