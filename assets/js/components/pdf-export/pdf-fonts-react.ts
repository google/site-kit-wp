/**
 * PDF font registration for @react-pdf/renderer.
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
import { Font } from '@react-pdf/renderer';

/**
 * Internal dependencies
 */
import googleSansDisplayRegular from './fonts/google-sans-display-regular.ttf';
import googleSansTextMedium from './fonts/google-sans-text-medium.ttf';
import googleSansTextRegular from './fonts/google-sans-text-regular.ttf';
import { PDF_FONT_FAMILY_DISPLAY, PDF_FONT_FAMILY_TEXT } from './pdf-theme';

let fontsRegistered = false;

/**
 * Registers Site Kit's brand fonts with @react-pdf/renderer.
 *
 * Embeds Google Sans Display (400) and Google Sans Text (400, 500) so the
 * generated PDF renders in the dashboard's typography. The font binaries are
 * emitted as hashed static assets by webpack and fetched by @react-pdf at
 * render time (not when this function runs), so the dashboard's page load is
 * unaffected. Registration is idempotent for the lifetime of the session.
 *
 * Errors are intentionally not caught: a failure propagates so the orchestrator
 * transitions to its ERROR stage rather than silently rendering in a fallback
 * typeface.
 *
 * @since n.e.x.t
 *
 * @return {string} The display font family name.
 */
export function registerPDFFonts() {
	if ( fontsRegistered ) {
		return PDF_FONT_FAMILY_DISPLAY;
	}

	Font.register( {
		family: PDF_FONT_FAMILY_DISPLAY,
		fonts: [ { src: googleSansDisplayRegular, fontWeight: 400 } ],
	} );

	Font.register( {
		family: PDF_FONT_FAMILY_TEXT,
		fonts: [
			{ src: googleSansTextRegular, fontWeight: 400 },
			{ src: googleSansTextMedium, fontWeight: 500 },
		],
	} );

	// Disable hyphenation so words wrap whole rather than being split.
	Font.registerHyphenationCallback( ( word ) => [ word ] );

	fontsRegistered = true;

	return PDF_FONT_FAMILY_DISPLAY;
}
