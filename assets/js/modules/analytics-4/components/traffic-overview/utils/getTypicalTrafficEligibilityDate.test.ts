/**
 * Traffic Overview `getTypicalTrafficEligibilityDate` utility tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { getTypicalTrafficEligibilityDate } from './getTypicalTrafficEligibilityDate';

describe( 'getTypicalTrafficEligibilityDate', () => {
	it( 'should return the same day thirteen months earlier for a day in the middle of a month', () => {
		expect( getTypicalTrafficEligibilityDate( '2026-10-15' ) ).toBe(
			'2025-09-15'
		);
	} );

	it.each( [
		[ '2026-03-31', '2025-02-28' ],
		[ '2028-03-31', '2027-02-28' ],
		// February has 29 days in 2024.
		[ '2025-03-31', '2024-02-29' ],
	] )(
		'should return the last day of February for %s, rather than a day in March',
		( referenceDate, expectedDate ) => {
			expect( getTypicalTrafficEligibilityDate( referenceDate ) ).toBe(
				expectedDate
			);
		}
	);

	it( 'should return a day in the December of the year before last for a day in January', () => {
		expect( getTypicalTrafficEligibilityDate( '2027-01-20' ) ).toBe(
			'2025-12-20'
		);
	} );
} );
