/**
 * Get next report date tests.
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
import { getDateString } from '@/js/util';
import getNextReportDate from './getNextReportDate';

describe( 'getNextReportDate', () => {
	describe( 'weekly frequency', () => {
		it.each( [
			[ '2026-07-14', 1, '2026-07-20' ], // Tuesday -> next Monday.
			[ '2026-07-12', 0, '2026-07-19' ], // Sunday -> next Sunday.
			[ '2026-07-18', 6, '2026-07-25' ], // Saturday -> next Saturday.
		] )(
			'returns %s week start %i as %s',
			( referenceDate, weekStartDay, expectedDate ) => {
				const nextReportDate = getNextReportDate(
					'weekly',
					referenceDate,
					weekStartDay
				);

				expect( getDateString( nextReportDate ) ).toEqual(
					expectedDate
				);
			}
		);
	} );

	describe( 'monthly frequency', () => {
		it.each( [
			[ '2026-01-31', '2026-02-01' ],
			[ '2026-07-14', '2026-08-01' ],
			[ '2026-12-31', '2027-01-01' ],
		] )(
			'returns next month first day for %s as %s',
			( referenceDate, expectedDate ) => {
				const nextReportDate = getNextReportDate(
					'monthly',
					referenceDate,
					1
				);

				expect( getDateString( nextReportDate ) ).toEqual(
					expectedDate
				);
			}
		);
	} );

	describe( 'quarterly frequency', () => {
		it.each( [
			[ '2026-01-15', '2026-04-01' ],
			[ '2026-03-31', '2026-04-01' ],
			[ '2026-11-20', '2027-01-01' ],
			[ '2026-12-31', '2027-01-01' ],
		] )(
			'returns next quarter first day for %s as %s',
			( referenceDate, expectedDate ) => {
				const nextReportDate = getNextReportDate(
					'quarterly',
					referenceDate,
					1
				);

				expect( getDateString( nextReportDate ) ).toEqual(
					expectedDate
				);
			}
		);
	} );
} );
