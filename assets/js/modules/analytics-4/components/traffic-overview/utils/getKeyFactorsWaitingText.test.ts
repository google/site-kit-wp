/**
 * Traffic Overview `getKeyFactorsWaitingText` utility tests.
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
import { getKeyFactorsWaitingText } from './getKeyFactorsWaitingText';

describe( 'getKeyFactorsWaitingText', () => {
	it( 'should say when to check back for the key factors when they show on a later day', () => {
		expect( getKeyFactorsWaitingText( '2025-02-06', '2025-02-05' ) ).toBe(
			'There’s no previous period to compare to yet. Check back on February 6, 2025 to see which channels changed the most.'
		);
	} );

	it.each( [
		[
			'today',
			'2025-02-05',
			'There’s no previous period to compare to. Select a date range that ends on or after February 5, 2025 to see which channels changed the most.',
		],
		[
			'a day that has passed',
			'2025-01-10',
			'There’s no previous period to compare to. Select a date range that ends on or after January 10, 2025 to see which channels changed the most.',
		],
	] )(
		'should ask for a date range that ends later when the key factors show from %s',
		( _, availableFrom, text ) => {
			// The selected range ends in the past, before the day, so a range
			// that ends on the day or later has the key factors.
			expect(
				getKeyFactorsWaitingText( availableFrom, '2025-02-05' )
			).toBe( text );
		}
	);

	it( 'should say only that there is no previous period when the site has no recorded traffic up to the end of the date range', () => {
		expect( getKeyFactorsWaitingText( null, '2025-02-05' ) ).toBe(
			'There’s no previous period to compare to.'
		);
	} );
} );
