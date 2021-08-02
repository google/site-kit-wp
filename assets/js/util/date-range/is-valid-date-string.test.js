/**
 * `isValidDateInstance` utility tests.
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
import { isValidDateString } from './is-valid-date-string';

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
