/**
 * Traffic Overview `getTypicalTrafficRangeWaitingText` utility tests.
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
import { getTypicalTrafficRangeWaitingText } from './getTypicalTrafficRangeWaitingText';

describe( 'getTypicalTrafficRangeWaitingText', () => {
	it( 'should say when to check back for the typical traffic range when it shows on a later day', () => {
		expect(
			getTypicalTrafficRangeWaitingText( '2025-04-02', '2025-02-05' )
		).toBe(
			'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.'
		);
	} );

	it.each( [
		[
			'today',
			'2025-02-05',
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after February 5, 2025 to see it.',
		],
		[
			'a day that has passed',
			'2025-01-10',
			'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after January 10, 2025 to see it.',
		],
	] )(
		'should ask for a date range that ends later when the typical traffic range shows from %s',
		( _, availableFrom, text ) => {
			// The selected range ends in the past, before the day, so a range
			// that ends on the day or later has the typical traffic range.
			expect(
				getTypicalTrafficRangeWaitingText( availableFrom, '2025-02-05' )
			).toBe( text );
		}
	);

	it( 'should say only that the history is too short when the site has no recorded traffic up to the end of the date range', () => {
		expect( getTypicalTrafficRangeWaitingText( null, '2025-02-05' ) ).toBe(
			'There isn’t enough traffic history for a typical traffic range on these dates.'
		);
	} );
} );
