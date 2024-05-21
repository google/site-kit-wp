/**
 * String to Date utility tests.
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
import { stringToDate } from './string-to-date';
import { INVALID_DATE_STRING_ERROR } from './constants';

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
