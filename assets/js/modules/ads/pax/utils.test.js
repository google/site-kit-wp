/**
 * PAX util functions tests.
 *
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
import { INVALID_DATE_STRING_ERROR } from '../../../util';
import { formatPaxDate } from './utils';

describe( 'formatPaxDate', () => {
	it.each( [ null, NaN, '', '12345', '1900-00-00', 'not a date string' ] )(
		'throws an error when given the invalid date string: %s',
		( invalidDateString ) => {
			expect( () => formatPaxDate( invalidDateString ) ).toThrow(
				INVALID_DATE_STRING_ERROR
			);
		}
	);

	it( 'uses a one-indexed month', () => {
		const date = formatPaxDate( '2019-01-31' );

		expect( date.year ).toBe( 2019 );
		expect( date.month ).toBe( 1 );
		expect( date.day ).toBe( 31 );
	} );

	it( 'returns a valid date instance for the given date string', () => {
		const date = formatPaxDate( '2019-10-31' );

		expect( date.year ).toBe( 2019 );
		expect( date.month ).toBe( 10 ); // 1-index based month
		expect( date.day ).toBe( 31 );
	} );
} );
