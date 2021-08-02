/**
 * `sortByProperty` utility tests.
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
import { sortByProperty } from '../sort-by-property';

const sortMe = [
	{ slug: 'objectOne', name: 'First', order: 1 },
	{ slug: 'objectTwo', name: 'Fifth', order: 10 },
	{ slug: 'objectThree', name: 'Fourth', order: 9 },
	{ slug: 'objectFour', name: 'Second', order: 3 },
	{ slug: 'objectFive', name: 'Third', order: 7 },
];

describe( 'sortByProperty', () => {
	it( 'returns an object correctly sorted passed key', () => {
		const expectedResults = [
			{ slug: 'objectOne', name: 'First', order: 1 },
			{ slug: 'objectFour', name: 'Second', order: 3 },
			{ slug: 'objectFive', name: 'Third', order: 7 },
			{ slug: 'objectThree', name: 'Fourth', order: 9 },
			{ slug: 'objectTwo', name: 'Fifth', order: 10 },
		];

		expect( sortByProperty( sortMe, 'order' ) ).toStrictEqual(
			expectedResults
		);
	} );
	it( 'returns an object with the same order if sort key is omitted or is not on the object', () => {
		expect( sortByProperty( sortMe ) ).toStrictEqual( sortMe );
		expect( sortByProperty( sortMe, 'undefinedSortKey' ) ).toStrictEqual(
			sortMe
		);
	} );
} );
