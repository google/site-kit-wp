/**
 * core/user isValidDateInstance utility tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { isValidDateString } from './is-valid-date-string';

describe( 'isValidDateString', () => {
	it( 'should return true for valid date', () => {
		expect( isValidDateString( '2020-09-24' ) ).toEqual( true );
	} );

	it( 'should return false for empty param', () => {
		expect( isValidDateString() ).toEqual( false );
	} );

	it( 'should return false for completely invalid param: "invalid-date"', () => {
		expect( isValidDateString( 'invalid-date' ) ).toEqual( false );
	} );

	it( 'should return false for invalid date: "2020-99-99"', () => {
		expect( isValidDateString( '2020-99-99' ) ).toEqual( false );
	} );

	it( 'should return false for `undefined`', () => {
		expect( isValidDateString( undefined ) ).toEqual( false );
	} );

	it( 'should return false for `null`', () => {
		expect( isValidDateString( null ) ).toEqual( false );
	} );

	it( 'should return false for Boolean', () => {
		expect( isValidDateString( true ) ).toEqual( false );
	} );

	it( 'should return false for Number', () => {
		expect( isValidDateString( 100000 ) ).toEqual( false );
	} );

	it( 'should return false for Object', () => {
		expect( isValidDateString( {} ) ).toEqual( false );
	} );

	it( 'should return false for Array', () => {
		expect( isValidDateString( [] ) ).toEqual( false );
	} );

	it( 'should return false for Function', () => {
		expect( isValidDateString( () => {} ) ).toEqual( false );
	} );
} );
