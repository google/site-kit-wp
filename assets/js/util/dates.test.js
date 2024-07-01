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
	isValidDateInstance,
	isValidDateString,
	isValidDateRange,
	stringToDate,
	dateAgo,
	DAY_IN_SECONDS,
} from './dates';

// [ testName, relativeDate, daysBefore, expectedReturnError ]
const errorValuesToTest = [
	[
		'should throw error if no param is passed',
		undefined,
		undefined,
		INVALID_DATE_STRING_ERROR,
	],
	[
		'should throw error if date supplied is invalid',
		'invalid-date',
		1,
		INVALID_DATE_STRING_ERROR,
	],
	[
		'should throw error if date supplied is invalid date',
		'2020-99-99',
		1,
		INVALID_DATE_STRING_ERROR,
	],
];

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

describe( 'isValidDateInstance', () => {
	// [ testName, date, expectedReturnValue ]
	const valuesToTest = [
		[
			'should return true for valid date instance (no constructor params)',
			new Date(),
			true,
		],
		[
			'should return true for valid date instance (valid constructor params)',
			new Date( 100000 ),
			true,
		],
		[
			'should return false for invalid date instance',
			new Date( 'invalid-date' ),
			false,
		],
		[ 'should return false for `undefined`', undefined, false ],
		[ 'should return false for `null`', null, false ],
		[ 'should return false for Boolean', true, false ],
		[ 'should return false for Number', 100000, false ],
		[ 'should return false for String', '2020-09-14T01:03:41.493Z', false ],
		[ 'should return false for Object', {}, false ],
		[ 'should return false for Array', [], false ],
		[ 'should return false for Function', () => {}, false ],
	];

	it.each( valuesToTest )( '%s', ( _testName, dateInstance, expected ) => {
		expect( isValidDateInstance( dateInstance ) ).toEqual( expected );
	} );
} );

describe( 'getPreviousDate', () => {
	it.each( errorValuesToTest )(
		'%s',
		( _testName, relativeDate, daysBefore, expected ) => {
			try {
				getPreviousDate( relativeDate, daysBefore );
			} catch ( error ) {
				expect( error.message ).toEqual( expected );
			}
		}
	);

	// [ relativeDate, daysBefore, expectedReturnDate ]
	const valuesToTest = [
		[ '2020-01-01', 0, '2020-01-01' ],
		[ '2020-01-02', 1, '2020-01-01' ],
		[ '2020-01-08', 7, '2020-01-01' ],
		[ '2020-02-01', 31, '2020-01-01' ],
		[ '2021-01-01', 366, '2020-01-01' ],
		[ '2020-01-01', 1, '2019-12-31' ],
	];
	const testName =
		'with date of %s and days before value of %s should return %s';
	it.each( valuesToTest )(
		testName,
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
	// [ testName, dateString, expectedReturnValue ]
	const valuesToTest = [
		[ 'should return true for valid date', '2020-09-24', true ],
		[ 'should return false for empty param', undefined, false ],
		[
			'should return false for completely invalid param: "invalid-date"',
			'invalid-date',
			false,
		],
		[
			'should return false for invalid date: "2020-99-99"',
			'2020-99-99',
			false,
		],
		[ 'should return false for `undefined`', undefined, false ],
		[ 'should return false for `null`', null, false ],
		[ 'should return false for Boolean', true, false ],
		[ 'should return false for Number', 100000, false ],
		[ 'should return false for Object', {}, false ],
		[ 'should return false for Array', [], false ],
		[ 'should return false for Function', () => {}, false ],
	];

	it.each( valuesToTest )( '%s', ( _testName, dateString, expected ) => {
		expect( isValidDateString( dateString ) ).toEqual( expected );
	} );
} );

describe( 'isValidDateRange', () => {
	// [ dateRange, expectedReturnValue ]
	const valuesToTest = [
		[ 'last-1-days', true ],
		[ 'last-7-days', true ],
		[ 'last-28-days', true ],
		[ 'last-1-day', false ],
		[ 'invalid-range', false ],
		[ 'invalid-date-range', false ],
	];

	it.each( valuesToTest )(
		'with date range of %s should return %s',
		( dateRange, expected ) => {
			expect( isValidDateRange( dateRange ) ).toEqual( expected );
		}
	);
} );

describe( 'dateAgo', () => {
	// [ testName, initialDate, duration, expectedDate ]
	const tests = [
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
	];

	it.each( tests )( 'should %s', ( _, from, duration, want ) => {
		const got = dateAgo( from, duration );
		expect( got.toISOString() ).toBe( want.toISOString() );
	} );
} );
