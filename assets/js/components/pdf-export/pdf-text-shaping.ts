/**
 * Complex-script text shaping and line layout for the PDF report
 * (@react-pdf/renderer).
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
 * such script is described once here: how to detect it, how to reshape it to
 * contextual forms, the single font to draw it in (its font-stack fallback
 * crashes `@react-pdf`'s reordering), and its base direction. `PDFTypography`
 * lays text out per line via `layoutComplexScriptLines` so `@react-pdf` never
 * wraps or reorders it. Adding a script is one entry plus its bundled font.
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
	/** Converts logical-order text to contextual forms (identity if none). */
	reshape: ( text: string ) => string;
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

// A non-breaking space (U+00A0). Words within a laid-out line are joined with it
// so `@react-pdf` treats the line as one unit and never re-wraps it, which is
// what makes its multi-line reorder (and the crash it carries) never run.
const NON_BREAKING_SPACE = String.fromCharCode( 0x00a0 );

// Estimated glyph advance as a fraction of the font size, used only to choose
// wrap points. Noto Sans Arabic averages ~0.86em; biased up so estimates lean
// toward wrapping early rather than overflowing. Because lines are joined with
// non-breaking spaces, an inaccurate estimate shifts wrap points at worst, it
// never breaks generation.
const ESTIMATED_ADVANCE_EM = 0.9;

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
 * Estimates the rendered width of text in points.
 *
 * A deliberately coarse heuristic (a constant advance per code point); it only
 * decides wrap points, and the non-breaking-space join keeps any error harmless.
 *
 * @since n.e.x.t
 *
 * @param {string} text     The text to measure.
 * @param {number} fontSize The font size in points.
 * @return {number} The estimated width in points.
 */
function estimateWidth( text: string, fontSize: number ): number {
	// Arabic-script text is in the Basic Multilingual Plane, so `length` (UTF-16
	// units) equals the code-point count.
	return text.length * ESTIMATED_ADVANCE_EM * fontSize;
}

/**
 * Lays complex-script text out into visual-order lines that fit a width.
 *
 * `@react-pdf` 4.x cannot shape or reorder complex scripts and crashes when it
 * wraps them, so the report owns the layout: reshape to contextual forms, break
 * into lines in logical order at the given width, reorder each line to visual
 * order, and join each line's words with a non-breaking space so `@react-pdf`
 * draws it as one non-wrapping unit in the script's single font. Its broken
 * shaping, reordering, and line breaking never run.
 *
 * @since n.e.x.t
 *
 * @param {string}           text     Logical-order complex-script text.
 * @param {PDFComplexScript} script   The handler for the text's script.
 * @param {number}           fontSize The font size in points.
 * @param {number}           maxWidth The available width in points.
 * @return {string[]} Visual-order lines, each a non-breaking-space-joined string.
 */
export function layoutComplexScriptLines(
	text: string,
	script: PDFComplexScript,
	fontSize: number,
	maxWidth: number
): string[] {
	const reshaped = script.reshape( text );
	const words = reshaped.split( ' ' );
	const spaceWidth = estimateWidth( ' ', fontSize );

	const lineWordGroups: string[][] = [];
	let currentWords: string[] = [];
	let currentWidth = 0;

	for ( const word of words ) {
		const wordWidth = estimateWidth( word, fontSize );
		const addedWidth = ( currentWords.length ? spaceWidth : 0 ) + wordWidth;

		if ( currentWords.length && currentWidth + addedWidth > maxWidth ) {
			lineWordGroups.push( currentWords );
			currentWords = [ word ];
			currentWidth = wordWidth;
		} else {
			currentWords.push( word );
			currentWidth += addedWidth;
		}
	}

	if ( currentWords.length ) {
		lineWordGroups.push( currentWords );
	}

	return lineWordGroups.map( ( lineWords ) => {
		const logicalLine = lineWords.join( ' ' );
		const embeddingLevels = bidi.getEmbeddingLevels(
			logicalLine,
			script.direction
		);
		const visualLine = bidi.getReorderedString(
			logicalLine,
			embeddingLevels
		);

		return visualLine.split( ' ' ).join( NON_BREAKING_SPACE );
	} );
}

// The complex scripts the report handles, in match order. Extend by adding an
// entry (detection ranges, single font, direction, reshaper) and bundling its
// font; `PDFTypography` needs no change.
const COMPLEX_SCRIPTS: ReadonlyArray< PDFComplexScript > = [
	{
		id: 'arabic',
		ranges: ARABIC_SCRIPT_RANGES,
		fontFamily: PDF_FONT_FAMILY_ARABIC,
		direction: 'rtl',
		reshape: convertArabic,
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
