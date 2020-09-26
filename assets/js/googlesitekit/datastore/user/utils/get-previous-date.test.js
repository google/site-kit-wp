/**
 * core/user getPreviousDate utility tests.
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
import { INVALID_DATE_STRING_ERROR } from './constants';
import { getPreviousDate } from './get-previous-date';

describe( 'getPreviousDate', () => {
	it( 'should throw error if no param is passed', () => {
		try {
			getPreviousDate();
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should throw error if date supplied is invalid', () => {
		try {
			getPreviousDate( 'invalid-date', 1 );
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should throw error if date supplied is invalid date', () => {
		try {
			getPreviousDate( '2020-99-99', 1 );
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should return "2020-01-01" for a date of "2020-01-01" and a days before value of 0', () => {
		expect( getPreviousDate( '2020-01-01', 0 ) ).toEqual( '2020-01-01' );
	} );

	it( 'should return "2020-01-01" for a date of "2020-01-02" and a days before value of 1', () => {
		expect( getPreviousDate( '2020-01-02', 1 ) ).toEqual( '2020-01-01' );
	} );

	it( 'should return "2020-01-01" for a date of "2020-01-08" and a days before value of 7', () => {
		expect( getPreviousDate( '2020-01-08', 7 ) ).toEqual( '2020-01-01' );
	} );

	it( 'should return "2020-01-01" for a date of "2020-02-01" and a days before value of 31', () => {
		expect( getPreviousDate( '2020-02-01', 31 ) ).toEqual( '2020-01-01' );
	} );

	it( 'should return "2020-01-01" for a date of "2021-01-01" and a days before value of 366', () => {
		expect( getPreviousDate( '2021-01-01', 366 ) ).toEqual( '2020-01-01' );
	} );

	it( 'should return "2019-12-31" for a date of "2020-01-01" and a days before value of 1', () => {
		expect( getPreviousDate( '2020-01-01', 1 ) ).toEqual( '2019-12-31' );
	} );
} );
