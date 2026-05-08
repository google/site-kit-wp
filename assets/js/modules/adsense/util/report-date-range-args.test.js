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

describe( 'AdSense report date range: generateDateRangeArgs', () => {
	it( 'should throw if a `dates` object is not provided', () => {
		expect( () => generateDateRangeArgs() ).toThrow(
			'A dates object is required.'
		);
	} );

	it( 'should throw if `startDate` argument is not provided', () => {
		expect( () =>
			generateDateRangeArgs( { endDate: '2021-01-27' } )
		).toThrow( 'A valid startDate is required.' );
	} );

	it( 'should throw if `endDate` argument is not provided', () => {
		expect( () =>
			generateDateRangeArgs( { startDate: '2021-01-01' } )
		).toThrow( 'A valid endDate is required.' );
	} );

	it( 'should return an object containing a `d` key, the value of which is the `startDate` and `endDate` arguments formatted and concatenated', () => {
		const result = generateDateRangeArgs( {
			startDate: '2021-01-01',
			endDate: '2021-01-27',
		} );

		expect( result.d ).toBe( '2021/01/01-2021/01/27' );
	} );
} );
