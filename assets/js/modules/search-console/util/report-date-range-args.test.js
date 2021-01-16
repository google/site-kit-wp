/**
 * Tests for reporting date range utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { generateDateRangeArgs } from './report-date-range-args';

describe( 'Search Console reporting date range arguments', () => {
	describe( 'generateDateRangeArgs', () => {
		const allArgs = {
			startDate: '2020-12-18',
			endDate: '2021-01-14',
		};

		describe( 'if `startDate` or `endDate` arguments are not provided', () => {
			it( 'should return args untouched', () => {
				const { startDate, endDate } = allArgs;

				const noArgsPassed = generateDateRangeArgs();
				const startDatePassed = generateDateRangeArgs( { startDate } );
				const endDatePassed = generateDateRangeArgs( { endDate } );

				expect( noArgsPassed ).toBe( undefined );
				expect( startDatePassed ).toMatchObject( { startDate } );
				expect( endDatePassed ).toMatchObject( { endDate } );
			} );
		} );

		it( 'should return an object containing a `start_date` key, the value of which is the `startDate` argument with "-" stripped', () => {
			const { startDate, endDate } = allArgs;
			const result = generateDateRangeArgs( { startDate, endDate } );
			const expected = startDate.replace( /-/g, '' );

			expect( result.start_date ).toBe( expected );
		} );

		it( 'should return an object containing a `end_date` key, the value of which is the `endDate` argument with "-" stripped', () => {
			const { startDate, endDate } = allArgs;
			const result = generateDateRangeArgs( { startDate, endDate } );
			const expected = endDate.replace( /-/g, '' );

			expect( result.end_date ).toBe( expected );
		} );
	} );
} );
