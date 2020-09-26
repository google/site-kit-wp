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
import { isValidDateInstance } from './is-valid-date-instance';

describe( 'isValidDateInstance', () => {
	it( 'should return true for valid date instance (no constructor params)', () => {
		expect( isValidDateInstance( new Date() ) ).toEqual( true );
	} );

	it( 'should return true for valid date instance (valid constructor params)', () => {
		expect( isValidDateInstance( new Date( 100000 ) ) ).toEqual( true );
	} );

	it( 'should return false for invalid date instance', () => {
		expect( isValidDateInstance( new Date( 'invalid-date' ) ) ).toEqual( false );
	} );

	it( 'should return false for `undefined`', () => {
		expect( isValidDateInstance( undefined ) ).toEqual( false );
	} );

	it( 'should return false for `null`', () => {
		expect( isValidDateInstance( null ) ).toEqual( false );
	} );

	it( 'should return false for Boolean', () => {
		expect( isValidDateInstance( true ) ).toEqual( false );
	} );

	it( 'should return false for Number', () => {
		expect( isValidDateInstance( 100000 ) ).toEqual( false );
	} );

	it( 'should return false for String', () => {
		expect( isValidDateInstance( '2020-09-14T01:03:41.493Z' ) ).toEqual( false );
	} );

	it( 'should return false for Object', () => {
		expect( isValidDateInstance( {} ) ).toEqual( false );
	} );

	it( 'should return false for Array', () => {
		expect( isValidDateInstance( [] ) ).toEqual( false );
	} );

	it( 'should return false for Function', () => {
		expect( isValidDateInstance( () => {} ) ).toEqual( false );
	} );
} );
