/**
 * `hasTypicalTrafficRange` utility tests.
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
import { hasTypicalTrafficRange } from './hasTypicalTrafficRange';

describe( 'hasTypicalTrafficRange', () => {
	const dailyTraffic = [
		{
			date: '2025-02-04',
			visits: 120,
			expectedMin: 98.3,
			expectedMax: 137.1,
		},
		{
			date: '2025-02-05',
			visits: 40,
			expectedMin: 38.2,
			expectedMax: 53.3,
		},
	];

	it( 'should be true when every day has both bounds', () => {
		expect( hasTypicalTrafficRange( dailyTraffic ) ).toBe( true );
	} );

	it( 'should be true for a day whose fewest typical visits are 0', () => {
		expect(
			hasTypicalTrafficRange( [
				{ ...dailyTraffic[ 0 ], expectedMin: 0, expectedMax: 3.4 },
			] )
		).toBe( true );
	} );

	it.each( [
		[ 'a day has no bounds', { expectedMin: null, expectedMax: null } ],
		[ 'a day has no fewest visits', { expectedMin: null } ],
		[ 'a day has no most visits', { expectedMax: null } ],
	] )( 'should be false when %s', ( _, bounds ) => {
		expect(
			hasTypicalTrafficRange( [
				dailyTraffic[ 0 ],
				{ ...dailyTraffic[ 1 ], ...bounds },
			] )
		).toBe( false );
	} );

	it( 'should be false without a day', () => {
		expect( hasTypicalTrafficRange( [] ) ).toBe( false );
		expect( hasTypicalTrafficRange() ).toBe( false );
	} );
} );
