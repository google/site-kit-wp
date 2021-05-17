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

		it( 'returns ranges of equal length if the total number of items is too short', () => {
			const firstThree = genItems( { batch: 1, length: 3 } );
			const secondThree = genItems( { batch: 2, length: 3 } );
			const report = [].concat( firstThree, secondThree );
			report.pop(); // Drop the last item.

			const { compareRange, currentRange } = partitionReport( report, { dateRangeLength: 3 } );

			expect( compareRange.length ).toEqual( currentRange.length );
			expect( compareRange ).toEqual( firstThree.slice( 0, 2 ) );
			expect( currentRange ).toEqual( secondThree.slice( 0, 2 ) );
		} );
	} );
} );
