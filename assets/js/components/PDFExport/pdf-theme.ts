/**
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
 * Colour tokens shared across the PDF report header, footer, and tiles.
 *
 * @since n.e.x.t
 */
export const colors = {
	/** Primary body and heading text. */
	text: '#202124',
	/** Muted secondary text, e.g. date ranges and captions. */
	secondary: '#5f6368',
	/** Link text colour used by the header and footer links. */
	link: '#1a73e8',
	/** Hairline divider colour, e.g. the footer's top border. */
	border: '#dadce0',
} as const;

/**
 * Font-size tokens shared across the PDF report components.
 *
 * @since n.e.x.t
 */
export const fontSizes = {
	/** Small print, e.g. footer links and captions. */
	small: 9,
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
	/** Vertical padding applied above and below the footer links. */
	footerPaddingVertical: 12,
} as const;
