/**
 * `getPreviousWeekDate` utility tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
	// [ relativeDate, daysBefore, expectedReturnError ]
	const errorValuesToTest = [
		[ 'should throw error if no param is passed', undefined, undefined, INVALID_DATE_STRING_ERROR ],
		[ 'should throw error if date supplied is invalid', 'invalid-date', 1, INVALID_DATE_STRING_ERROR ],
		[ 'should throw error if date supplied is invalid date', '2020-99-99', 1, INVALID_DATE_STRING_ERROR ],
	];

	it.each( errorValuesToTest )( '%s', ( _testName, relativeDate, daysBefore, expected ) => {
		try {
			getPreviousWeekDate( relativeDate, daysBefore );
		} catch ( error ) {
			expect( error.message ).toEqual( expected );
		}
	} );

	// [ daysBefore, expectedReturnDate ]
	const valuesToTest = [
		[ 0, '2020-09-24' ],
		[ 1, '2020-09-17' ],
		[ 2, '2020-09-17' ],
		[ 3, '2020-09-17' ],
		[ 4, '2020-09-17' ],
		[ 5, '2020-09-17' ],
		[ 6, '2020-09-17' ],
		[ 7, '2020-09-17' ],
		[ 8, '2020-09-17' ],
		[ 9, '2020-09-17' ],
		[ 10, '2020-09-10' ],
		[ 11, '2020-09-10' ],
		[ 28, '2020-08-27' ],
		[ 90, '2020-06-25' ],
		[ 180, '2020-03-26' ],
	];
	const referenceDate = '2020-09-24';

	it.each( valuesToTest )( 'with daysBefore value of %s should return %s', ( daysBefore, expected ) => {
		expect( getPreviousWeekDate( referenceDate, daysBefore ) ).toEqual( expected );
	} );
} );
