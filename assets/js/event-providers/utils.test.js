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
import {
	isLikelyEmail,
	normalizeEmail,
	normalizePhone,
	normalizeValue,
} from './utils';

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

	describe( 'normalizePhone', () => {
		it( 'should return an empty string when no phone number is provided', () => {
			expect( normalizePhone() ).toBe( '' );
		} );

		it.each( [
			[ ' 123-456-7890 ', '1234567890' ],
			[ '(123) 456-7890', '1234567890' ],
			[ '+1 (123) 456-7890', '+11234567890' ],
			[ '123.456.7890', '1234567890' ],
			[ ' 1234567890 ', '1234567890' ],
			[ ' +44 20 7946 0958 ', '+442079460958' ],
			[ ' +91-9876543210 ', '+919876543210' ],
			[ ' 9876543210 ', '9876543210' ],
		] )( 'should normalize %s to %s', ( input, output ) => {
			expect( normalizePhone( input ) ).toBe( output );
		} );
	} );

	describe( 'isLikelyEmail', () => {
		it.each( [
			[ ' foo@bar.com ', true ],
			[ ' FOO BAR', false ],
			[ 'foo@bar', false ],
			[ ' bar.com ', false ],
			[ '123123', false ],
		] )(
			'should check if %s is likely an email address',
			( input, result ) => {
				expect( isLikelyEmail( input ) ).toBe( result );
			}
		);
	} );
} );
