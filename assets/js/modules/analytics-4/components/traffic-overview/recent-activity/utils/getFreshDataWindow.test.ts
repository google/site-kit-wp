/**
 * Recent activity `getFreshDataWindow` utility tests.
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
import {
	getFreshDataWindow,
	getFreshDataWindowStart,
} from './getFreshDataWindow';

describe( 'getFreshDataWindowStart', () => {
	it( 'should return the start of the hour 23 hours before the current hour', () => {
		expect(
			getFreshDataWindowStart( Date.parse( '2026-10-13T08:44:59Z' ) )
		).toBe( Date.parse( '2026-10-12T09:00:00Z' ) );
	} );
} );

describe( 'getFreshDataWindow', () => {
	it( 'should return the days and the 24 hours of the window in the given time zone', () => {
		expect(
			getFreshDataWindow(
				Date.parse( '2026-10-12T09:00:00Z' ),
				'America/Los_Angeles'
			)
		).toEqual( {
			startDate: '2026-10-12',
			endDate: '2026-10-13',
			dateHours: [
				'2026101202',
				'2026101203',
				'2026101204',
				'2026101205',
				'2026101206',
				'2026101207',
				'2026101208',
				'2026101209',
				'2026101210',
				'2026101211',
				'2026101212',
				'2026101213',
				'2026101214',
				'2026101215',
				'2026101216',
				'2026101217',
				'2026101218',
				'2026101219',
				'2026101220',
				'2026101221',
				'2026101222',
				'2026101223',
				'2026101300',
				'2026101301',
			],
		} );
	} );
} );
