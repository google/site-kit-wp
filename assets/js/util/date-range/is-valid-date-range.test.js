/**
 * `isValidDateRange` utility tests.
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
import { isValidDateRange } from './is-valid-date-range';

describe( 'isValidDateString', () => {
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
