/**
 * Tests for reporting date range utilities.
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
import { generateDateRangeArgs } from './report-date-range-args';

describe( 'Search Console reporting date range arguments', () => {
	describe( 'generateDateRangeArgs', () => {
		it( 'should throw if `startDate` or `endDate` arguments are not provided', () => {
			expect( () =>
				generateDateRangeArgs( { startDate: '2020-12-18' } )
			).toThrow( 'A valid endDate is required' );

			expect( () =>
				generateDateRangeArgs( { endDate: '2021-01-14' } )
			).toThrow( 'A valid startDate is required' );
		} );

		it( 'should return an object containing a `start_date` key, the value of which is the `startDate` argument with "-" stripped', () => {
			const result = generateDateRangeArgs( {
				startDate: '2020-12-18',
				endDate: '2021-01-14',
			} );
			expect( result.start_date ).toBe( '20201218' );
		} );

		it( 'should return an object containing a `end_date` key, the value of which is the `endDate` argument with "-" stripped', () => {
			const result = generateDateRangeArgs( {
				startDate: '2020-12-18',
				endDate: '2021-01-14',
			} );
			expect( result.end_date ).toBe( '20210114' );
		} );
	} );
} );
