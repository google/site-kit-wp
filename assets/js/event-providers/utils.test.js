/**
 * Tests for conversion tracking event provider utilities.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { normalizeEmail, normalizeValue } from './utils';

describe( 'Event Providers Utilities', () => {
	describe( 'normalizeValue', () => {
		it( 'should return an empty string when no value is provided', () => {
			expect( normalizeValue() ).toBe( '' );
		} );

		it.each( [
			[ ' Example Value ', 'example value' ],
			[ ' John Doe', 'john doe' ],
			[ 'MixedCaseValue ', 'mixedcasevalue' ],
			[ '  12345 ', '12345' ],
			[ '  ', '' ],
			[ '  Special!@#Value$%^ ', 'special!@#value$%^' ],
		] )( 'should normalize %s to %s', ( input, output ) => {
			expect( normalizeEmail( input ) ).toBe( output );
		} );
	} );

	describe( 'normalizeEmail', () => {
		it( 'should return an empty string when no email is provided', () => {
			expect( normalizeValue() ).toBe( '' );
		} );

		it.each( [
			[ ' foo@bar.com ', 'foo@bar.com' ],
			[ ' FOO@BAR.COM  ', 'foo@bar.com' ],
			[ 'Foo@Bar.Com ', 'foo@bar.com' ],
			[ 'fo.o@bar.com ', 'fo.o@bar.com' ],
			[ ' foo.bar@gmail.com ', 'foobar@gmail.com' ],
			[ ' foo.bar@googlemail.com ', 'foobar@googlemail.com' ],
			[ '"fo.o@ba.r"@gmail.com ', '"foo@bar"@gmail.com' ],
			[ ' "fo.o@ba.r"@googlemail.com', '"foo@bar"@googlemail.com' ],
		] )( 'should normalize %s to %s', ( input, output ) => {
			expect( normalizeEmail( input ) ).toBe( output );
		} );
	} );
} );
