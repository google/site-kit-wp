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

/**
 * Colour tokens shared across the PDF report header, footer, and tiles.
 *
 * @since n.e.x.t
 */
export const colors = {
	/** Primary body and heading text. */
	text: '#202124',
	/** Muted secondary text, e.g. date ranges and captions. */
	secondary: '#5f6368',
	/** Muted footer link text (Figma: surfaces/on-surface-variant). */
	onSurfaceVariant: '#6c726e',
} as const;

/**
 * Font-size tokens shared across the PDF report components.
 *
 * @since n.e.x.t
 */
export const fontSizes = {
	/** Small print, e.g. footer links and captions. */
	small: 12,
	/** Default body copy. */
	body: 12,
	/** Section subheadings. */
	subheading: 16,
	/** The report title. */
	heading: 20,
} as const;

/**
 * Spacing tokens shared across the PDF report components.
 *
 * @since n.e.x.t
 */
export const spacing = {
	/** Gap above the footer links (Figma: 44px above the footer). */
	footerMarginTop: 44,
	/**
	 * Horizontal gap between footer links. Centring the links with a fixed gap
	 * (rather than spreading them edge-to-edge) keeps the group in the middle of
	 * the page and lets it grow for longer translated labels. Approximates the
	 * ~49.5px gap implied by the Figma layout.
	 */
	footerLinkGap: 48,
	/** Vertical gap between footer links when they wrap (Figma: gap-y 4px). */
	footerLinkRowGap: 4,
} as const;
