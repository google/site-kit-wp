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
	getAddress,
	getEmail,
	getPhoneNumber,
	getUserData,
	hasPhoneLikePattern,
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

	describe( 'hasPhoneLikePattern', () => {
		it.each( [
			'123-456-7890',
			'(123) 456-7890',
			'+1 (123) 456-7890',
			'123.456.7890',
			'+44 20 7946 0958',
			'9876543210',
			'+919876543210',
		] )( 'should detect "%s" as having a phone like pattern', ( input ) => {
			expect( hasPhoneLikePattern( input ) ).toBe( true );
		} );

		it.each( [
			'f1bc311ae4',
			'123456',
			'12-34',
			'++ + + + 1234567',
			'(xx) 123-4567',
			'123-abc-4567',
			'phone: 1234567890',
			'',
		] )(
			'should detect "%s" as not having a phone like pattern',
			( input ) => {
				expect( hasPhoneLikePattern( input ) ).toBe( false );
			}
		);

		it( 'should allow multiple plus/parentheses/dots/spaces if digits are sufficient', () => {
			expect( hasPhoneLikePattern( '++(123).456.7890' ) ).toBe( true );
		} );

		it( 'should reject when non-allowed characters appear even with enough digits', () => {
			expect( hasPhoneLikePattern( '1234567#' ) ).toBe( false );
			expect( hasPhoneLikePattern( '1234567x' ) ).toBe( false );
		} );
	} );

	describe( 'getAddress', () => {
		it( 'should return undefined when no name fields are provided', () => {
			expect( getAddress( [] ) ).toBeUndefined();
			expect(
				getAddress( [
					{ type: PII_TYPE.EMAIL, value: 'test@example.com' },
					{ type: PII_TYPE.PHONE, value: '1234567890' },
				] )
			).toBeUndefined();
		} );

		it( 'should extract first_name from a single name field', () => {
			expect(
				getAddress( [ { type: PII_TYPE.NAME, value: 'john' } ] )
			).toEqual( {
				first_name: 'john',
			} );
		} );

		it( 'should extract first_name and last_name from a single full name field', () => {
			expect(
				getAddress( [ { type: PII_TYPE.NAME, value: 'john doe' } ] )
			).toEqual( {
				first_name: 'john',
				last_name: 'doe',
			} );
		} );

		it( 'should handle multiple name parts in last name', () => {
			expect(
				getAddress( [
					{ type: PII_TYPE.NAME, value: 'john doe smith jr' },
				] )
			).toEqual( {
				first_name: 'john',
				last_name: 'doe smith jr',
			} );
		} );

		it( 'should handle multiple separate name fields', () => {
			expect(
				getAddress( [
					{ type: PII_TYPE.NAME, value: 'john' },
					{ type: PII_TYPE.NAME, value: 'doe' },
				] )
			).toEqual( {
				first_name: 'john',
				last_name: 'doe',
			} );
		} );

		it( 'should handle multiple separate name fields with more than 2 names', () => {
			expect(
				getAddress( [
					{ type: PII_TYPE.NAME, value: 'john' },
					{ type: PII_TYPE.NAME, value: 'michael' },
					{ type: PII_TYPE.NAME, value: 'doe' },
				] )
			).toEqual( {
				first_name: 'john',
				last_name: 'michael doe',
			} );
		} );
	} );

	describe( 'getEmail', () => {
		it( 'should return undefined when no email field is provided', () => {
			expect( getEmail( [] ) ).toBeUndefined();
			expect(
				getEmail( [
					{ type: PII_TYPE.NAME, value: 'john doe' },
					{ type: PII_TYPE.PHONE, value: '1234567890' },
				] )
			).toBeUndefined();
		} );

		it( 'should extract email from fields', () => {
			expect(
				getEmail( [
					{ type: PII_TYPE.EMAIL, value: 'test@example.com' },
					{ type: PII_TYPE.NAME, value: 'john doe' },
				] )
			).toBe( 'test@example.com' );
		} );

		it( 'should return the first email when multiple emails exist', () => {
			expect(
				getEmail( [
					{ type: PII_TYPE.EMAIL, value: 'first@example.com' },
					{ type: PII_TYPE.EMAIL, value: 'second@example.com' },
				] )
			).toBe( 'first@example.com' );
		} );
	} );

	describe( 'getPhoneNumber', () => {
		it( 'should return undefined when no phone field is provided', () => {
			expect( getPhoneNumber( [] ) ).toBeUndefined();
			expect(
				getPhoneNumber( [
					{ type: PII_TYPE.NAME, value: 'john doe' },
					{ type: PII_TYPE.EMAIL, value: 'test@example.com' },
				] )
			).toBeUndefined();
		} );

		it( 'should extract phone number from fields', () => {
			expect(
				getPhoneNumber( [
					{ type: PII_TYPE.PHONE, value: '1234567890' },
					{ type: PII_TYPE.NAME, value: 'john doe' },
				] )
			).toBe( '1234567890' );
		} );

		it( 'should return the first phone number when multiple phone numbers exist', () => {
			expect(
				getPhoneNumber( [
					{ type: PII_TYPE.PHONE, value: '1234567890' },
					{ type: PII_TYPE.PHONE, value: '+15551234567' },
				] )
			).toBe( '1234567890' );
		} );
	} );

	describe( 'getUserData', () => {
		it( 'should return undefined when no PII fields are provided', () => {
			expect( getUserData( [] ) ).toBeUndefined();
		} );

		it( 'should return object with only available PII fields', () => {
			expect(
				getUserData( [
					{ type: PII_TYPE.EMAIL, value: 'test@example.com' },
				] )
			).toEqual( {
				email: 'test@example.com',
			} );

			expect(
				getUserData( [ { type: PII_TYPE.PHONE, value: '1234567890' } ] )
			).toEqual( {
				phone_number: '1234567890',
			} );

			expect(
				getUserData( [ { type: PII_TYPE.NAME, value: 'john doe' } ] )
			).toEqual( {
				address: {
					first_name: 'john',
					last_name: 'doe',
				},
			} );
		} );

		it( 'should return object with all available PII fields', () => {
			expect(
				getUserData( [
					{ type: PII_TYPE.EMAIL, value: 'test@example.com' },
					{ type: PII_TYPE.PHONE, value: '1234567890' },
					{ type: PII_TYPE.NAME, value: 'john doe' },
				] )
			).toEqual( {
				address: {
					first_name: 'john',
					last_name: 'doe',
				},
				email: 'test@example.com',
				phone_number: '1234567890',
			} );
		} );

		it( 'should handle mixed data correctly', () => {
			expect(
				getUserData( [
					{ type: PII_TYPE.EMAIL, value: 'john@example.com' },
					{ type: PII_TYPE.NAME, value: 'john' },
					{ type: PII_TYPE.NAME, value: 'smith' },
					{ type: 'other', value: 'non-pii-data' },
				] )
			).toEqual( {
				address: {
					first_name: 'john',
					last_name: 'smith',
				},
				email: 'john@example.com',
			} );
		} );

		it( 'should return undefined if no user data could be extracted', () => {
			expect(
				getUserData( [ { type: 'other', value: 'non-pii-data' } ] )
			).toBeUndefined();
		} );
	} );
} );
