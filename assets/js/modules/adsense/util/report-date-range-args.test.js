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

describe( 'AdSense reporting date range arguments', () => {
	describe( 'generateDateRangeArgs', () => {
		const allArgs = {
			startDate: '2021-01-01',
			endDate: '2021-01-27',
		};

		it( 'should throw if `startDate` or `endDate` arguments are not provided', () => {
			const { startDate, endDate } = allArgs;
			try {
				generateDateRangeArgs();
			} catch ( error ) {
				expect( error.message ).toEqual( 'dates object is required' );
			}
			try {
				generateDateRangeArgs( { startDate } );
			} catch ( error ) {
				expect( error.message ).toEqual( 'endDate is required' );
			}
			try {
				generateDateRangeArgs( { endDate } );
			} catch ( error ) {
				expect( error.message ).toEqual( 'startDate is required' );
			}
		} );

		it( 'should return an object containing a `d` key, the value of which is the `startDate` argument with "-" replaced with "/", concatenated to the `endDate` argument also with "-" replaced with "/", using `-` to join the two strings', () => {
			const { startDate, endDate } = allArgs;
			const result = generateDateRangeArgs( { startDate, endDate } );

			expect( result.d ).toBe( '2021/01/01-2021/01/27' );
		} );
	} );
} );
