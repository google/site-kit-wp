/**
 * Sorting functions tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { caseInsensitiveListSort } from './sort';

describe( 'caseInsensitiveListSort', () => {
	it( 'should sort an array of objects by a given field (case-insensitive)', () => {
		const listToSort = [
			{ name: 'Banana' },
			{ name: 'apple' },
			{ name: 'Cherry' },
		];

		const sortedList = caseInsensitiveListSort( listToSort, 'name' );

		expect( sortedList ).toEqual( [
			{ name: 'apple' },
			{ name: 'Banana' },
			{ name: 'Cherry' },
		] );
	} );

	it( 'should sort an array of arrays by a given field index (case-insensitive)', () => {
		const listToSort = [
			[ 'Banana', 2 ],
			[ 'apple', 1 ],
			[ 'Cherry', 3 ],
		];

		const sortedList = caseInsensitiveListSort( listToSort, 0 );

		expect( sortedList ).toEqual( [
			[ 'apple', 1 ],
			[ 'Banana', 2 ],
			[ 'Cherry', 3 ],
		] );
	} );

	it( 'should return the list unchanged if already sorted', () => {
		const listToSort = [
			{ name: 'apple' },
			{ name: 'Banana' },
			{ name: 'Cherry' },
		];

		const sortedList = caseInsensitiveListSort( listToSort, 'name' );

		expect( sortedList ).toEqual( [
			{ name: 'apple' },
			{ name: 'Banana' },
			{ name: 'Cherry' },
		] );
	} );

	it( 'should return an empty array if the list is empty', () => {
		const listToSort = [];

		const sortedList = caseInsensitiveListSort( listToSort, 'name' );

		expect( sortedList ).toEqual( [] );
	} );

	it( 'should return the original list if non-objects/non-arrays are passed', () => {
		const listToSort = [ 1, 2, 3 ];

		const sortedList = caseInsensitiveListSort( listToSort, 'name' );

		expect( sortedList ).toEqual( [ 1, 2, 3 ] );
	} );
} );
