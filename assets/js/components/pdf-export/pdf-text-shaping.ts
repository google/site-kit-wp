/**
 * Complex-script text shaping for the PDF report (@react-pdf/renderer).
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
import { convertArabic } from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_ARABIC } from '@/js/components/pdf-export/pdf-theme';

/**
 * A complex-script handler for the PDF report.
 *
 * `@react-pdf` cannot shape or reorder complex or right-to-left scripts, so each
 * such script is described once here: how to detect it, how to shape it to
 * visual order, the single font to draw it in (its font-stack fallback crashes
 * `@react-pdf`'s reordering), and its base direction. Adding a script is one
 * entry plus its bundled font, with no change to `PDFTypography`.
 *
 * @since n.e.x.t
 */
export interface PDFComplexScript {
	/** Identifier, e.g. `'arabic'`. */
	id: string;
	/** Inclusive Unicode code-point ranges that identify the script. */
	ranges: ReadonlyArray< readonly [ number, number ] >;
	/** The single `@react-pdf` font family the script renders in. */
	fontFamily: string;
	/** The script's base direction. */
	direction: 'rtl' | 'ltr';
	/** Shapes logical-order text to visual order for `@react-pdf`. */
	shape: ( text: string ) => string;
}

// Inclusive Arabic-script Unicode blocks: Arabic, Arabic Supplement, Arabic
// Extended-A, and Arabic Presentation Forms-A and -B. Covers Arabic and Persian
// (both share this block) and the presentation forms Noto Sans Arabic provides.
const ARABIC_SCRIPT_RANGES: ReadonlyArray< readonly [ number, number ] > = [
	[ 0x0600, 0x06ff ],
	[ 0x0750, 0x077f ],
	[ 0x08a0, 0x08ff ],
	[ 0xfb50, 0xfdff ],
	[ 0xfe70, 0xfeff ],
];

const bidi = bidiFactory();

/**
 * Determines whether text contains a character in any of the given ranges.
 *
 * @since n.e.x.t
 *
 * @param {string} text   The text to test.
 * @param {Array}  ranges Inclusive `[ start, end ]` code-point ranges.
 * @return {boolean} `true` when a character falls in one of the ranges.
 */
function textContainsRanges(
	text: string,
	ranges: ReadonlyArray< readonly [ number, number ] >
): boolean {
	for ( const char of text ) {
		const code = char.codePointAt( 0 );

		if ( code === undefined ) {
			continue;
		}

		for ( const [ start, end ] of ranges ) {
			if ( code >= start && code <= end ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Shapes Arabic-script text (Arabic and Persian) for `@react-pdf/renderer`.
 *
 * `@react-pdf` 4.x neither joins the letters into their contextual forms nor
 * reorders right-to-left text correctly, so it renders garbled. The reshaper
 * converts base letters to their contextual presentation forms (`arabic-reshaper`
 * handles Persian identically to a dedicated Persian shaper), and `bidi-js`
 * reorders the string to visual order (leaving embedded Latin, URLs, and numbers
 * in their own direction). `@react-pdf` then draws the result left to right with
 * a single Arabic font, so its broken shaping and reordering never run.
 *
 * @since n.e.x.t
 *
 * @param {string} text Logical-order Arabic-script text.
 * @return {string} Visual-order text with joined presentation forms.
 */
function shapeArabicText( text: string ): string {
	const reshaped = convertArabic( text );
	const embeddingLevels = bidi.getEmbeddingLevels( reshaped, 'rtl' );

	return bidi.getReorderedString( reshaped, embeddingLevels );
}

// The complex scripts the report handles, in match order. Extend by adding an
// entry (detection ranges, single font, direction, shaper) and bundling its
// font; `PDFTypography` needs no change.
const COMPLEX_SCRIPTS: ReadonlyArray< PDFComplexScript > = [
	{
		id: 'arabic',
		ranges: ARABIC_SCRIPT_RANGES,
		fontFamily: PDF_FONT_FAMILY_ARABIC,
		direction: 'rtl',
		shape: shapeArabicText,
	},
];

/**
 * Resolves the complex-script handler for text, if any.
 *
 * @since n.e.x.t
 *
 * @param {string} text The text to inspect.
 * @return {(PDFComplexScript|undefined)} The first matching handler, or
 *                                        `undefined` for text that needs no
 *                                        shaping (Latin, Cyrillic, digits).
 */
export function getComplexScript( text: string ): PDFComplexScript | undefined {
	return COMPLEX_SCRIPTS.find( ( script ) =>
		textContainsRanges( text, script.ranges )
	);
}
