/**
 * `getNextDate` utility tests.
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
import { getNextDate } from './get-next-date';

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

describe( 'getNextDate', () => {
	it.each( errorValuesToTest )(
		'%s',
		( _testName, relativeDate, daysBefore, expected ) => {
			try {
				getNextDate( relativeDate, daysBefore );
			} catch ( error ) {
				expect( error.message ).toEqual( expected );
			}
		}
	);

	// [ relativeDate, daysBefore, expectedReturnDate ]
	const valuesToTest = [
		[ '2020-01-01', 0, '2020-01-01' ],
		[ '2020-01-02', 1, '2020-01-03' ],
		[ '2020-01-08', 7, '2020-01-15' ],
		[ '2020-02-01', 31, '2020-03-03' ],
		[ '2021-01-01', 366, '2022-01-02' ],
		[ '2020-12-31', 1, '2021-01-01' ],
	];
	const testName =
		'with date of %s and days before value of %s should return %s';
	it.each( valuesToTest )(
		testName,
		( relativeDate, daysBefore, expected ) => {
			expect( getNextDate( relativeDate, daysBefore ) ).toEqual(
				expected
			);
		}
	);
} );
