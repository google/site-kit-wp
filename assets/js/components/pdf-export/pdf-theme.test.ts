/**
 * Tests for PDF theme font-family resolution.
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
import {
	PDF_FONT_FAMILY_ARABIC,
	PDF_FONT_FAMILY_CYRILLIC,
	PDF_FONT_FAMILY_TEXT,
	getPDFFontFallbackFamily,
	getPDFFontFamily,
} from './pdf-theme';

describe( 'getPDFFontFallbackFamily', () => {
	it.each( [ 'fa', 'ar', 'fa-IR', 'ar_SA', 'AR' ] )(
		'returns the Arabic family for the %s locale',
		( locale ) => {
			expect( getPDFFontFallbackFamily( locale ) ).toBe(
				PDF_FONT_FAMILY_ARABIC
			);
		}
	);

	it.each( [ 'ru', 'uk', 'bg', 'sr', 'be', 'mk', 'ru-RU', 'uk_UA' ] )(
		'returns the Cyrillic family for the %s locale',
		( locale ) => {
			expect( getPDFFontFallbackFamily( locale ) ).toBe(
				PDF_FONT_FAMILY_CYRILLIC
			);
		}
	);

	it.each( [ 'en', 'en-US', 'de-DE', 'fr', 'zz', '' ] )(
		'returns undefined for the Latin or unknown locale %p',
		( locale ) => {
			expect( getPDFFontFallbackFamily( locale ) ).toBeUndefined();
		}
	);
} );

describe( 'getPDFFontFamily', () => {
	it( 'stacks the Cyrillic fallback after the base family for a Cyrillic locale', () => {
		expect( getPDFFontFamily( PDF_FONT_FAMILY_TEXT, 'ru-RU' ) ).toEqual( [
			PDF_FONT_FAMILY_TEXT,
			PDF_FONT_FAMILY_CYRILLIC,
		] );
	} );

	it( 'stacks the Arabic fallback after the base family for an Arabic locale', () => {
		expect( getPDFFontFamily( PDF_FONT_FAMILY_TEXT, 'fa_IR' ) ).toEqual( [
			PDF_FONT_FAMILY_TEXT,
			PDF_FONT_FAMILY_ARABIC,
		] );
	} );

	it( 'returns the base family unchanged for a Latin locale', () => {
		expect( getPDFFontFamily( PDF_FONT_FAMILY_TEXT, 'en-US' ) ).toBe(
			PDF_FONT_FAMILY_TEXT
		);
	} );
} );
