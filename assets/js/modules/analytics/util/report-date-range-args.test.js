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

describe( 'Analytics reporting date range arguments', () => {
	describe( 'generateDateRangeArgs', () => {
		const allArgs = {
			startDate: '2020-01-12',
			endDate: '2021-01-12',
			compareStartDate: '2020-01-12',
			compareEndDate: '2021-01-12',
		};

		describe( 'if `startDate` or `endDate` arguments are not provided', () => {
			it( 'should return undefined', () => {
				const { startDate, endDate } = allArgs;

				const noArgsPassed = generateDateRangeArgs();
				const startDatePassed = generateDateRangeArgs( { startDate } );
				const endDatePassed = generateDateRangeArgs( { endDate } );

				expect( noArgsPassed ).toBe( undefined );
				expect( startDatePassed ).toBe( undefined );
				expect( endDatePassed ).toBe( undefined );
			} );
		} );

		it( 'should return an object containing a `_u.date00` key, the value of which is the `startDate` argument with "-" stripped', () => {
			const { startDate, endDate } = allArgs;
			const result = generateDateRangeArgs( { startDate, endDate } );

			expect( result[ '_u.date00' ] ).toBe( '20200112' );
		} );

		it( 'should return an object containing a `_u.date01` key, the value of which is the `endDate` argument with "-" stripped', () => {
			const { startDate, endDate } = allArgs;
			const result = generateDateRangeArgs( { startDate, endDate } );

			expect( result[ '_u.date01' ] ).toBe( '20210112' );
		} );

		describe( 'if `compareStartDate` and `compareEndDate` keys are passed', () => {
			it( 'should return an object containing a `_u.date10` key, the value of which is the `compareStartDate` argument with "-" stripped', () => {
				const result = generateDateRangeArgs( allArgs );
				expect( result[ '_u.date10' ] ).toBe( '20200112' );
			} );
			it( 'should return an object containing a `_u.date11` key, the value of which is the `compareEndDate` argument with "-" stripped', () => {
				const result = generateDateRangeArgs( allArgs );
				expect( result[ '_u.date11' ] ).toBe( '20210112' );
			} );
		} );
	} );
} );
