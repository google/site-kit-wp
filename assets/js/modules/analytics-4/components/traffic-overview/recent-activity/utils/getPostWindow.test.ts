/**
 * Recent activity `getPostWindow` utility tests.
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
import { getPostWindow } from './getPostWindow';

/**
 * Gets a time in the browser's time zone in ISO 8601 format, so the tests pass
 * in any time zone.
 *
 * @since n.e.x.t
 *
 * @param {...number} args The `Date` constructor arguments, e.g. `2026, 9, 8, 14, 5`.
 * @return {string} The time in ISO 8601 format.
 */
function getLocalTime( ...args: [ number, number, number, number, number ] ) {
	return new Date( ...args ).toISOString();
}

describe( 'getPostWindow', () => {
	it( 'starts the day before the publish day and ends on the reference date', () => {
		expect(
			getPostWindow( getLocalTime( 2026, 8, 17, 14, 30 ), '2026-10-08' )
		).toEqual( {
			startDate: '2026-09-16',
			endDate: '2026-10-08',
		} );
	} );

	it( 'drops the publish time, so a post published just before midnight starts the day before its publish day', () => {
		expect(
			getPostWindow( getLocalTime( 2026, 9, 6, 23, 59 ), '2026-10-08' )
				.startDate
		).toBe( '2026-10-05' );
	} );

	it( 'starts the day before the reference date for a post published on the reference date', () => {
		expect(
			getPostWindow( getLocalTime( 2026, 9, 8, 0, 5 ), '2026-10-08' )
		).toEqual( {
			startDate: '2026-10-07',
			endDate: '2026-10-08',
		} );
	} );

	it( 'gives a one-day range when the reference date is before the publish day', () => {
		expect(
			getPostWindow( getLocalTime( 2026, 9, 8, 14, 30 ), '2026-10-01' )
		).toEqual( {
			startDate: '2026-10-01',
			endDate: '2026-10-01',
		} );
	} );
} );
