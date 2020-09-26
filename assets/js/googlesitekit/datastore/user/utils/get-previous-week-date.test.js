/**
 * core/user getPreviousWeekDate utility tests.
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
import { getPreviousWeekDate } from './get-previous-week-date';

describe( 'getPreviousWeekDate', () => {
	const referenceDate = '2020-09-24';

	it( 'should throw error if no param is passed', () => {
		try {
			getPreviousWeekDate();
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should throw error if date supplied is invalid', () => {
		try {
			getPreviousWeekDate( 'invalid-date', 1 );
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should throw error if date supplied is invalid date', () => {
		try {
			getPreviousWeekDate( '2020-99-99', 1 );
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_STRING_ERROR );
		}
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 0 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 0 ) ).toEqual( '2020-09-24' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 1 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 1 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 2 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 2 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 3 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 3 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 4 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 4 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 5 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 5 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 6 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 6 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 7 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 7 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 8 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 8 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-17" with daysBefore value of 9 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 9 ) ).toEqual( '2020-09-17' );
	} );

	it( 'should go back to "2020-09-10" with daysBefore value of 10 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 10 ) ).toEqual( '2020-09-10' );
	} );

	it( 'should go back to "2020-09-10" with daysBefore value of 11 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 11 ) ).toEqual( '2020-09-10' );
	} );

	it( 'should go back to "2020-08-27" with daysBefore value of 28 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 28 ) ).toEqual( '2020-08-27' );
	} );

	it( 'should go back to "2020-06-25" with daysBefore value of 90 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 90 ) ).toEqual( '2020-06-25' );
	} );

	it( 'should go back to "2020-03-26" with daysBefore value of 180 and date of "2020-09-24"', () => {
		expect( getPreviousWeekDate( referenceDate, 180 ) ).toEqual( '2020-03-26' );
	} );
} );
