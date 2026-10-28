/**
 * Text truncation helper tests for the Your visitor groups PDF widget.
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
	getTruncationHyphenationCallback,
	splitIntoCharacters,
} from './pdfTextTruncation';

describe( 'splitIntoCharacters', () => {
	it( 'should split a word into its characters with an empty part between each pair', () => {
		expect( splitIntoCharacters( 'Cork' ) ).toEqual( [
			'C',
			'',
			'o',
			'',
			'r',
			'',
			'k',
		] );
	} );

	it( 'should return no parts for an empty word', () => {
		expect( splitIntoCharacters( '' ) ).toEqual( [] );
	} );
} );

describe( 'getTruncationHyphenationCallback', () => {
	it( 'should return the character split for text without spaces', () => {
		expect( getTruncationHyphenationCallback( 'Vacoas-Phoenix' ) ).toBe(
			splitIntoCharacters
		);
	} );

	it( 'should return no callback for text with spaces', () => {
		expect(
			getTruncationHyphenationCallback( 'Beau Bassin-Rose Hill' )
		).toBeUndefined();
	} );

	it( 'should return the character split for empty text', () => {
		expect( getTruncationHyphenationCallback( '' ) ).toBe(
			splitIntoCharacters
		);
	} );
} );
