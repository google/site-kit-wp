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
	classifyPII,
	isLikelyEmail,
	isLikelyPhone,
	normalizeEmail,
	normalizePhone,
	normalizeValue,
	PII_TYPE,
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
			expect( normalizeValue( input ) ).toBe( output );
		} );
	} );

	describe( 'normalizeEmail', () => {
		it( 'should return an empty string when no email is provided', () => {
			expect( normalizeEmail() ).toBe( '' );
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
			[ '@domain.com', false ],
			[ 'user@', false ],
			[ '', false ],
			[ null, false ],
			[ undefined, false ],
		] )(
			'should check if %s is likely an email address',
			( input, result ) => {
				expect( isLikelyEmail( input ) ).toBe( result );
			}
		);
	} );

	describe( 'isLikelyPhone', () => {
		it.each( [
			[ ' 123-456-7890 ', true ],
			[ ' (123) 456-7890 ', true ],
			[ '+1 (123) 456-7890', true ],
			[ ' 12345 ', false ],
			[ 'foo bar', false ],
			[ '+1 123', false ],
			[ '12-34', false ],
			[ '', false ],
			[ null, false ],
			[ undefined, false ],
		] )(
			'should check if %s is likely a phone number',
			( input, result ) => {
				expect( isLikelyPhone( input ) ).toBe( result );
			}
		);
	} );

	describe( 'classifyPII', () => {
		it( 'should classify accordingly if type is specified', () => {
			expect(
				classifyPII( {
					type: 'email',
				} )
			).toEqual( {
				type: PII_TYPE.EMAIL,
				value: '',
			} );

			expect(
				classifyPII( {
					type: 'tel',
				} )
			).toEqual( {
				type: PII_TYPE.PHONE,
				value: '',
			} );
		} );

		it( 'should fallback to matching value pattern if type is not specified', () => {
			expect(
				classifyPII( {
					type: 'text',
					value: '   foo@bar.com ',
				} )
			).toEqual( {
				type: PII_TYPE.EMAIL,
				value: 'foo@bar.com',
			} );

			expect(
				classifyPII( {
					type: 'number',
					value: '+(121)-11-4213-1212',
				} )
			).toEqual( {
				type: PII_TYPE.PHONE,
				value: '+1211142131212',
			} );
		} );

		it( 'should fallback to checking indicators in name or label otherwise', () => {
			expect(
				classifyPII( {
					type: 'text',
					value: 'John ',
					name: 'first-name',
				} )
			).toEqual( {
				type: PII_TYPE.NAME,
				value: 'john',
			} );

			expect(
				classifyPII( {
					type: 'text',
					value: 'foo@bar ',
					label: 'Email address ',
				} )
			).toEqual( {
				type: PII_TYPE.EMAIL,
				value: 'foo@bar',
			} );

			expect(
				classifyPII( {
					type: 'text',
					value: '21231 ',
					name: 'phone',
				} )
			).toEqual( {
				type: PII_TYPE.PHONE,
				value: '21231',
			} );
		} );

		it( 'should handle null and undefined field meta gracefully', () => {
			expect( classifyPII( null ) ).toBe( null );
			expect( classifyPII( undefined ) ).toBe( null );
			expect( classifyPII( {} ) ).toBe( null );
		} );

		it( 'should handle null properties gracefully', () => {
			expect(
				classifyPII( {
					type: null,
					name: null,
					value: null,
					label: null,
				} )
			).toBe( null );
		} );

		it( 'should return null for unclassifiable inputs', () => {
			expect(
				classifyPII( {
					type: 'text',
					value: 'random text',
					name: 'unknown-field',
					label: 'Random Field',
				} )
			).toBe( null );

			expect(
				classifyPII( {
					type: 'number',
					value: '123',
					name: 'quantity',
				} )
			).toBe( null );
		} );
	} );
} );
