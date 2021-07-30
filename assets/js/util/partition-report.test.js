/**
 * Report paritioning tests.
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

/**
 * Internal dependencies
 */
import { partitionReport } from './partition-report';

describe( 'partitionReport', () => {
	it( 'it requires an array', () => {
		expect( () => partitionReport( {}, { dateRangeLength: 1 } ) ).toThrow( 'report must be an array' );
		expect( () => partitionReport( [], { dateRangeLength: 1 } ) ).not.toThrow();
	} );

	it( 'requires dateRangeLength to be a positive integer', () => {
		expect( () => partitionReport( [], {} ) ).toThrow( 'dateRangeLength must be a positive integer' );
		expect( () => partitionReport( [], { dateRangeLength: 0 } ) ).toThrow( 'dateRangeLength must be a positive integer' );
		expect( () => partitionReport( [], { dateRangeLength: 1 } ) ).not.toThrow();
	} );

	describe( 'partitions the given report into a currentRange and compareRange based on the dateRangeLength', () => {
		const genItems = ( { batch, length } ) => Array.from( { length } ).map( ( _, i ) => ( { batch, index: i } ) );

		it( 'partitions first items into compareRange and second items into currentRange', () => {
			const firstThree = genItems( { batch: 1, length: 3 } );
			const secondThree = genItems( { batch: 2, length: 3 } );
			const report = [].concat( firstThree, secondThree );

			const partitionedReport = partitionReport( report, { dateRangeLength: 3 } );

			expect( partitionedReport ).toEqual( {
				compareRange: firstThree,
				currentRange: secondThree,
			} );
		} );

		it( 'fills the currentRange from the report before the compareRange', () => {
			const report = genItems( { length: 5 } );

			const partitionedReport = partitionReport( report, { dateRangeLength: 3 } );

			expect( partitionedReport.currentRange ).toHaveLength( 3 );
			expect( partitionedReport.currentRange ).toEqual( [
				report[ 2 ],
				report[ 3 ],
				report[ 4 ],
			] );

			expect( partitionedReport.compareRange ).toHaveLength( 2 );
			expect( partitionedReport.compareRange ).toEqual( [
				report[ 0 ],
				report[ 1 ],
			] );
		} );

		it( 'supports reports with less rows than the dateRangeLength', () => {
			const report = genItems( { length: 1 } );

			const partitionedReport = partitionReport( report, { dateRangeLength: 7 } );

			expect( partitionedReport.currentRange ).toHaveLength( 1 );
			expect( partitionedReport.currentRange ).toEqual( report );

			expect( partitionedReport.compareRange ).toEqual( [] );
		} );

		it( 'supports empty reports', () => {
			const partitionedReport = partitionReport( [], { dateRangeLength: 7 } );

			expect( partitionedReport.currentRange ).toEqual( [] );
			expect( partitionedReport.compareRange ).toEqual( [] );
		} );

		it( 'ensures weekdays still line up as expected when last day is missing (if week(s) are requested)', () => {
			// Use somewhat realistic example data (yesterday here is 2020-11-09).
			const last7DaysWithoutYesterday = [
				{ date: '2020-11-03', weekday: 'MON' },
				{ date: '2020-11-04', weekday: 'TUE' },
				{ date: '2020-11-05', weekday: 'WED' },
				{ date: '2020-11-06', weekday: 'THU' },
				{ date: '2020-11-07', weekday: 'FRI' },
				{ date: '2020-11-08', weekday: 'SAT' },
			];
			const previous7Days = [
				{ date: '2020-10-27', weekday: 'MON' },
				{ date: '2020-10-28', weekday: 'TUE' },
				{ date: '2020-10-29', weekday: 'WED' },
				{ date: '2020-10-30', weekday: 'THU' },
				{ date: '2020-10-31', weekday: 'FRI' },
				{ date: '2020-11-01', weekday: 'SAT' },
				{ date: '2020-11-02', weekday: 'SUN' },
			];
			const report = [].concat( previous7Days, last7DaysWithoutYesterday );

			const partitionedReport = partitionReport( report, { dateRangeLength: 7 } );

			// Ensure specifically that weekdays between each entry in both
			// arrays align.
			const mapToWeekday = ( dataset ) => {
				return dataset.weekday;
			};
			expect( mapToWeekday( partitionedReport.compareRange ) ).toEqual( mapToWeekday( partitionedReport.currentRange ) );
		} );
	} );
} );
