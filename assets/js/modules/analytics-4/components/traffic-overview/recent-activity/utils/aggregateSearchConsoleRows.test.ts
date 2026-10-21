/**
 * Recent activity `aggregateSearchConsoleRows` utility tests.
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
import { aggregateSearchConsoleRows } from './aggregateSearchConsoleRows';

describe( 'aggregateSearchConsoleRows', () => {
	it( 'should sum the clicks and impressions of the hours from the start of the window', () => {
		// The window starts at 02:00 in Pacific Time, so the 01:00 row is left
		// out.
		expect(
			aggregateSearchConsoleRows(
				[
					{
						keys: [ '2026-10-12T01:00:00-07:00' ],
						clicks: 5,
						impressions: 50,
					},
					{
						keys: [ '2026-10-12T02:00:00-07:00' ],
						clicks: 2,
						impressions: 56,
					},
					{
						keys: [ '2026-10-12T17:00:00-07:00' ],
						clicks: 1,
						impressions: 3,
					},
				],
				Date.parse( '2026-10-12T09:00:00Z' )
			)
		).toEqual( { clicks: 3, impressions: 59 } );
	} );

	it( 'should return zero clicks and impressions for a report with no rows', () => {
		expect(
			aggregateSearchConsoleRows(
				[],
				Date.parse( '2026-10-12T09:00:00Z' )
			)
		).toEqual( { clicks: 0, impressions: 0 } );
	} );
} );
