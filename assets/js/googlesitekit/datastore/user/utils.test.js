/**
 * core/user Data store: utils tests.
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

import {
	getDateString,
	getPreviousDate,
	getPreviousWeekDate,
	isValidDateInstance,
} from './utils';

describe( 'core/user utils', () => {
	const INVALID_DATE_INSTANCE_ERROR = 'Date param must construct to a valid date instance or be a valid date instance itself.';
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

	describe( 'getDateString ', () => {
		const JANUARY = 0; // month is 0 indexed
		const date = new Date( 2020, JANUARY, 1 );
		const time = date.getTime();
		const isoString = date.toISOString();
		const gmtString = date.toGMTString();
		const utcString = date.toUTCString();

		it( `should throw error if no param is passed`, () => {
			try {
				getDateString( );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( `should throw error if date param is not a valid date constructor value`, () => {
			try {
				getDateString( 'invalid-date' );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( `should return "2020-01-01" for date instance of the same date`, () => {
			expect( getDateString( date ) ).toEqual( '2020-01-01' );
		} );
		it( `should return "2020-01-01" for millisecond value (${ time }) of the same date`, () => {
			expect( getDateString( time ) ).toEqual( '2020-01-01' );
		} );
		it( `should return "2020-01-01" for ISO string (${ isoString }) value of the same date`, () => {
			expect( getDateString( isoString ) ).toEqual( '2020-01-01' );
		} );
		it( `should return "2020-01-01" for GMT string (${ gmtString }) value of the same date`, () => {
			expect( getDateString( gmtString ) ).toEqual( '2020-01-01' );
		} );
		it( `should return "2020-01-01" for UTC string (${ utcString }) value of the same date`, () => {
			expect( getDateString( utcString ) ).toEqual( '2020-01-01' );
		} );
	} );

	describe( 'getPreviousDate', () => {
		it( 'should throw error if no param is passed', () => {
			try {
				getPreviousDate();
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( 'should throw error if date supplied is invalid', () => {
			try {
				getPreviousDate( 'invalid-date', 1 );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( 'should throw error if date supplied is invalid date', () => {
			try {
				getPreviousDate( '2020-99-99', 1 );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
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

	describe( 'getPreviousWeekDate', () => {
		it( 'should throw error if no param is passed', () => {
			try {
				getPreviousWeekDate();
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( 'should throw error if date supplied is invalid', () => {
			try {
				getPreviousWeekDate( 'invalid-date', 1 );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( 'should throw error if date supplied is invalid date', () => {
			try {
				getPreviousWeekDate( '2020-99-99', 1 );
			} catch ( error ) {
				expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
			}
		} );
		it( 'should go back 7 days with daysBefore value of 0 ', () => {
			expect( getPreviousWeekDate( '2020-01-10', 0 ) ).toEqual( '2020-01-03' );
		} );
		it( 'should go back 6 days with daysBefore value of 1 ', () => {
			expect( getPreviousWeekDate( '2020-01-10', 1 ) ).toEqual( '2020-01-03' );
		} );
	} );
} );
