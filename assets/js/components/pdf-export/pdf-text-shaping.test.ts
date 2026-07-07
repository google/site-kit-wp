/**
 * Tests for PDF complex-script text shaping.
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
import { PDF_FONT_FAMILY_ARABIC } from '@/js/components/pdf-export/pdf-theme';
import { getComplexScript } from './pdf-text-shaping';

/**
 * Reports whether text contains an Arabic presentation-form glyph (the joined
 * shapes the reshaper produces).
 *
 * @since n.e.x.t
 *
 * @param {string} text The text to inspect.
 * @return {boolean} `true` when a presentation-form character is present.
 */
function hasPresentationForm( text: string ): boolean {
	for ( const char of text ) {
		const code = char.codePointAt( 0 ) ?? 0;

		if (
			( code >= 0xfb50 && code <= 0xfdff ) ||
			( code >= 0xfe70 && code <= 0xfeff )
		) {
			return true;
		}
	}

	return false;
}

describe( 'getComplexScript', () => {
	it.each( [
		[ 'Arabic', 'أداء موقعك' ],
		[ 'Arabic mixed with Latin and digits', 'المقاييس 123 Site Kit' ],
		[ 'Persian', 'عملکرد سایت شما' ],
		[ 'Persian with the gaf letter', 'گزارش' ],
	] )( 'returns the Arabic handler for %s', ( _label, text ) => {
		const script = getComplexScript( text );

		expect( script ).toBeDefined();
		expect( script?.id ).toBe( 'arabic' );
		expect( script?.fontFamily ).toBe( PDF_FONT_FAMILY_ARABIC );
		expect( script?.direction ).toBe( 'rtl' );
	} );

	it.each( [
		[ 'Latin', 'Traffic' ],
		[ 'Cyrillic', 'Трафик' ],
		[ 'digits and symbols', '123 %' ],
		[ 'empty', '' ],
	] )( 'returns undefined for %s', ( _label, text ) => {
		expect( getComplexScript( text ) ).toBeUndefined();
	} );

	describe( 'the Arabic handler shape', () => {
		it( 'converts Arabic to visual-order presentation forms', () => {
			const output =
				getComplexScript( 'أداء موقعك' )?.shape( 'أداء موقعك' );

			expect( output ).not.toBe( 'أداء موقعك' );
			expect( hasPresentationForm( output ?? '' ) ).toBe( true );
		} );

		it( 'shapes Persian letterforms, including the gaf letter', () => {
			const input = 'گزارش پروژه';
			const output = getComplexScript( input )?.shape( input );

			expect( output ).not.toBe( input );
			expect( hasPresentationForm( output ?? '' ) ).toBe( true );
		} );

		it( 'keeps embedded Latin runs intact in mixed text', () => {
			const input = 'المقاييس الرئيسية Site Kit';
			const output = getComplexScript( input )?.shape( input );

			expect( output ).toContain( 'Site Kit' );
			expect( hasPresentationForm( output ?? '' ) ).toBe( true );
		} );
	} );
} );
