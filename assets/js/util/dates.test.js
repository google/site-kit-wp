/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
	INVALID_DATE_INSTANCE_ERROR,
	INVALID_DATE_STRING_ERROR,
	getDateString,
	getPreviousDate,
	isValidDateString,
	isValidDateRange,
	stringToDate,
	dateSub,
	DAY_IN_SECONDS,
} from './dates';

describe( 'getDateString', () => {
	it( 'should throw error if no param is passed', () => {
		try {
			getDateString();
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
		}
	} );

	it( 'should throw error if date param is not a valid date constructor value', () => {
		try {
			getDateString( 'invalid-date' );
		} catch ( error ) {
			expect( error.message ).toEqual( INVALID_DATE_INSTANCE_ERROR );
		}
	} );

	it( 'should return "2020-01-01" for date instance of the same date', () => {
		const JANUARY = 0; // month is 0 indexed
		const date = new Date( 2020, JANUARY, 1 );

		expect( getDateString( date ) ).toEqual( '2020-01-01' );
	} );
} );

describe( 'getPreviousDate', () => {
	it.each( [
		// [ testName, relativeDate, daysBefore, expectedReturnError ]
		[
			'no param is passed',
			undefined,
			undefined,
			INVALID_DATE_STRING_ERROR,
		],
		[
			'date supplied is invalid',
			'invalid-date',
			1,
			INVALID_DATE_STRING_ERROR,
		],
		[
			'date supplied is invalid date',
			'2020-99-99',
			1,
			INVALID_DATE_STRING_ERROR,
		],
	] )(
		'should throw error if %s',
		( _testName, relativeDate, daysBefore, expected ) => {
			try {
				getPreviousDate( relativeDate, daysBefore );
			} catch ( error ) {
				expect( error.message ).toEqual( expected );
			}
		}
	);

	it.each( [
		// [ relativeDate, daysBefore, expectedReturnDate ]
		[ '2020-01-01', 0, '2020-01-01' ],
		[ '2020-01-02', 1, '2020-01-01' ],
		[ '2020-01-08', 7, '2020-01-01' ],
		[ '2020-02-01', 31, '2020-01-01' ],
		[ '2021-01-01', 366, '2020-01-01' ],
		[ '2020-01-01', 1, '2019-12-31' ],
	] )(
		'with date of %s and days before value of %s should return %s',
		( relativeDate, daysBefore, expected ) => {
			expect( getPreviousDate( relativeDate, daysBefore ) ).toEqual(
				expected
			);
		}
	);
} );

describe( 'stringToDate', () => {
	it.each( [ null, NaN, '', '12345', '1900-00-00', 'not a date string' ] )(
		'throws an error when given the invalid date string: %s',
		( invalidDateString ) => {
			expect( () => stringToDate( invalidDateString ) ).toThrow(
				INVALID_DATE_STRING_ERROR
			);
		}
	);

	it( 'uses a zero-indexed month', () => {
		const date = stringToDate( '2019-01-31' );

		expect( date.getFullYear() ).toBe( 2019 );
		expect( date.getMonth() ).toBe( 0 );
		expect( date.getDate() ).toBe( 31 );
	} );

	it( 'returns a valid date instance for the given date string', () => {
		const date = stringToDate( '2019-10-31' );

		expect( date.getFullYear() ).toBe( 2019 );
		expect( date.getMonth() ).toBe( 10 - 1 ); // 0-based month
		expect( date.getDate() ).toBe( 31 );
	} );
} );

describe( 'isValidDateString', () => {
	it.each( [
		// [ testName, dateString, expectedReturnValue ]
		[ 'true for valid date', '2020-09-24', true ],
		[ 'false for empty param', undefined, false ],
		[ 'false for invalid date', 'invalid-date', false ],
		[ 'false for incorrect date: "2020-99-99"', '2020-99-99', false ],
		[ 'false for `undefined`', undefined, false ],
		[ 'false for `null`', null, false ],
		[ 'false for Boolean', true, false ],
		[ 'false for Number', 100000, false ],
		[ 'false for Object', {}, false ],
		[ 'false for Array', [], false ],
		[ 'false for Function', () => {}, false ],
	] )( 'should return %s', ( _, dateString, expected ) => {
		expect( isValidDateString( dateString ) ).toEqual( expected );
	} );
} );

describe( 'isValidDateRange', () => {
	it.each( [
		// [ dateRange, expectedReturnValue ]
		[ 'last-1-days', true ],
		[ 'last-7-days', true ],
		[ 'last-28-days', true ],
		[ 'last-1-day', false ],
		[ 'invalid-range', false ],
		[ 'invalid-date-range', false ],
	] )( 'with date range of %s should return %s', ( dateRange, expected ) => {
		expect( isValidDateRange( dateRange ) ).toEqual( expected );
	} );
} );

describe( 'dateSub', () => {
	it.each( [
		// [ testName, initialDate, duration, expectedDate ]
		[
			'properly subtract one day from the date provided as a string',
			'2021-01-02',
			DAY_IN_SECONDS,
			new Date( '2021-01-01' ),
		],
		[
			'properly subtract one day from the date provided as a Date object',
			new Date( '2021-01-02' ),
			DAY_IN_SECONDS,
			new Date( '2021-01-01' ),
		],
	] )( 'should %s', ( _, from, duration, want ) => {
		const got = dateSub( from, duration );
		expect( got.toISOString() ).toBe( want.toISOString() );
	} );
} );
